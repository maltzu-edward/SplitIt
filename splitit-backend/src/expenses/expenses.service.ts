import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';


@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) { }

  // tambah expense baru
  async addExpense(data: CreateExpenseDto) {
    // cek group ada gak
    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found!');
    }

    const newExpense = await this.prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        groupId: data.groupId,
        payerId: data.payerId,
        // per-person splits kalau ada
        ...(data.splits && data.splits.length > 0
          ? {
            splits: {
              create: data.splits.map((split) => ({
                userId: split.userId,
                amount: split.amount,
                description: split.description || null,
              })),
            },
          }
          : {}),
      },
      include: {
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        payer: { select: { id: true, name: true } },
      },
    });

    return { message: 'Expense recorded successfully!', data: newExpense };
  }

  // ambil expense dalam group
  async getGroupExpenses(groupId: string) {
    return this.prisma.expense.findMany({
      where: { groupId: groupId },
      include: {
        payer: { select: { id: true, name: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ambil summary uang yang harus dibayar dan yang harus diterima
  async getUserSummary(userId: string) {
    const owedToOthers = await this.prisma.expenseSplit.aggregate({
      where: {
        userId: userId,
        isPaid: false,
        expense: {
          payerId: {
            not: userId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const owedToUser = await this.prisma.expenseSplit.aggregate({
      where: {
        userId: {
          not: userId,
        },
        isPaid: false,
        expense: {
          payerId: userId,
        }
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalOwed: owedToOthers._sum.amount || 0,
      totalOwe: owedToUser._sum.amount || 0,
    };
  }

  // tandai split sebagai sudah dibayar (oleh yang hutang)
  async markSplitAsPaid(splitId: string) {
    const split = await this.prisma.expenseSplit.findUnique({ where: { id: splitId } });
    if (!split) throw new NotFoundException('Split not found!');
    return this.prisma.expenseSplit.update({
      where: { id: splitId },
      data: { isPaid: true },
    });
  }

  // upload bukti pembayaran + tandai sebagai paid
  async uploadProof(splitId: string, proofUrl: string) {
    const split = await this.prisma.expenseSplit.findUnique({ where: { id: splitId } });
    if (!split) throw new NotFoundException('Split not found!');
    return this.prisma.expenseSplit.update({
      where: { id: splitId },
      data: { isPaid: true, paymentProof: proofUrl, paidAt: new Date() },
    });
  }

  // ambil detail satu split (untuk halaman validasi)
  async getSplitById(splitId: string) {
    const split = await this.prisma.expenseSplit.findUnique({
      where: { id: splitId },
      include: {
        user: { select: { id: true, name: true } },
        expense: { select: { id: true, title: true, amount: true } },
      },
    });
    if (!split) throw new NotFoundException('Split not found!');
    return split;
  }

  // approve pembayaran (oleh yang dibayar)
  async validateSplitPayment(splitId: string) {
    const split = await this.prisma.expenseSplit.findUnique({ where: { id: splitId } });
    if (!split) throw new NotFoundException('Split not found!');
    return this.prisma.expenseSplit.update({
      where: { id: splitId },
      data: { isValidated: true },
    });
  }

  // tolak pembayaran → reset supaya debtor upload ulang
  async declineSplitPayment(splitId: string) {
    const split = await this.prisma.expenseSplit.findUnique({ where: { id: splitId } });
    if (!split) throw new NotFoundException('Split not found!');
    return this.prisma.expenseSplit.update({
      where: { id: splitId },
      data: { isPaid: false, paymentProof: null, paidAt: null },
    });
  }

  async getRecentActivity(userId: string) {
    const limit = 20;

    // 1. Query Messages (Only received messages)
    const messages = await this.prisma.message.findMany({
      where: {
        receiverId: userId,
      },
      include: {
        sender: { select: { name: true } },
        receiver: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const messageActivities = messages.map((m) => {
      return {
        id: m.id,
        type: 'MESSAGE',
        title: 'Chat Message',
        description: `${m.sender.name} sent you a message`,
        detail: m.content,
        createdAt: m.createdAt,
      };
    });

    // 2. Query Expense Splits (payments / settlements)
    const splits = await this.prisma.expenseSplit.findMany({
      where: {
        OR: [
          { userId: userId },
          { expense: { payerId: userId } },
        ],
        isPaid: true,
      },
      include: {
        user: { select: { name: true } },
        expense: {
          select: {
            title: true,
            payer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: limit,
    });

    const splitActivities = splits.map((s) => {
      const isMine = s.userId === userId; // I am the debtor
      const payerName = s.expense.payer.name;
      const debtorName = s.user.name;
      const title = s.expense.title;
      const amount = s.amount;

      if (isMine) {
        if (s.isValidated) {
          return {
            id: `split-val-${s.id}`,
            type: 'SETTLEMENT_APPROVED',
            title: 'Payment Approved',
            description: `Your payment to ${payerName} for "${title}" was approved`,
            amount,
            createdAt: s.paidAt || new Date(),
          };
        } else {
          return {
            id: `split-paid-${s.id}`,
            type: 'SETTLEMENT_SENT',
            title: 'Payment Sent',
            description: `You sent a payment to ${payerName} for "${title}"`,
            amount,
            createdAt: s.paidAt || new Date(),
          };
        }
      } else {
        if (s.isValidated) {
          return {
            id: `split-val-${s.id}`,
            type: 'SETTLEMENT_APPROVED_BY_YOU',
            title: 'Payment Approved',
            description: `You approved ${debtorName}'s payment for "${title}"`,
            amount,
            createdAt: s.paidAt || new Date(),
          };
        } else {
          return {
            id: `split-rec-${s.id}`,
            type: 'SETTLEMENT_RECEIVED',
            title: 'Payment Received',
            description: `${debtorName} sent a payment for "${title}"`,
            amount,
            createdAt: s.paidAt || new Date(),
          };
        }
      }
    });

    // 3. Query Expenses Added
    const expenses = await this.prisma.expense.findMany({
      where: {
        OR: [
          { payerId: userId },
          { splits: { some: { userId: userId } } },
        ],
      },
      include: {
        payer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const expenseActivities = expenses.map((e) => {
      const isMine = e.payerId === userId;
      return {
        id: `exp-${e.id}`,
        type: isMine ? 'EXPENSE_ADDED_BY_YOU' : 'EXPENSE_ADDED',
        title: 'Expense Added',
        description: isMine
          ? `You added "${e.title}"`
          : `${e.payer.name} added "${e.title}"`,
        amount: e.amount,
        createdAt: e.createdAt,
      };
    });

    // 4. Query Friendships
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId: userId }, { friendId: userId }],
      },
      include: {
        user: { select: { id: true, name: true } },
        friend: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const friendshipActivities = friendships.map((f) => {
      const isSender = f.userId === userId;
      const otherPersonName = isSender ? f.friend.name : f.user.name;
      const isAccepted = f.status === 'ACCEPTED';

      if (isAccepted) {
        return {
          id: `friend-acc-${f.id}`,
          type: 'FRIEND_ACCEPTED',
          title: 'New Friend',
          description: `You and ${otherPersonName} are now friends`,
          createdAt: f.createdAt,
        };
      } else {
        if (isSender) {
          return {
            id: `friend-sent-${f.id}`,
            type: 'FRIEND_SENT',
            title: 'Friend Request',
            description: `You sent a friend request to ${otherPersonName}`,
            createdAt: f.createdAt,
          };
        } else {
          return {
            id: `friend-rec-${f.id}`,
            type: 'FRIEND_RECEIVED',
            title: 'Friend Request',
            description: `${otherPersonName} sent you a friend request`,
            createdAt: f.createdAt,
          };
        }
      }
    });

    // Merge, sort, and slice
    const allActivities = [
      ...messageActivities,
      ...splitActivities,
      ...expenseActivities,
      ...friendshipActivities,
    ];

    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allActivities.slice(0, 15);
  }
}
