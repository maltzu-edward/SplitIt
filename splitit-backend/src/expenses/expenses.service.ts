import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

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
}
