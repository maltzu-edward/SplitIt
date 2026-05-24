import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // Route: POST http://127.0.0.1:3000/expenses
  @Post()
  addExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.addExpense(createExpenseDto);
  }

  // Route: GET http://127.0.0.1:3000/expenses/group/:groupId
  @Get('group/:groupId')
  getGroupExpenses(@Param('groupId') groupId: string) {
    return this.expensesService.getGroupExpenses(groupId);
  }

  // Route: GET http://127.0.0.1:3000/expenses/user-summary/:userId
  @Get('user-summary/:userId')
  getUserSummary(@Param('userId') userId: string) {
    return this.expensesService.getUserSummary(userId);
  }
}