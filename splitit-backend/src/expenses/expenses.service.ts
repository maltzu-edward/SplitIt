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
        isValidated: false,
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
        isValidated: false,
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
}
