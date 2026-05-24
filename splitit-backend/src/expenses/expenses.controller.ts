import { Controller, Post, Body, Get, Param, Patch, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

const proofStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `proof-${Date.now()}${extname(file.originalname)}`);
  },
});

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

  // Route: PATCH http://127.0.0.1:3000/expenses/split/:splitId/pay
  @Patch('split/:splitId/pay')
  markSplitAsPaid(@Param('splitId') splitId: string) {
    return this.expensesService.markSplitAsPaid(splitId);
  }

  // Route: GET http://127.0.0.1:3000/expenses/split/:splitId
  @Get('split/:splitId')
  getSplitById(@Param('splitId') splitId: string) {
    return this.expensesService.getSplitById(splitId);
  }

  // Route: PATCH http://127.0.0.1:3000/expenses/split/:splitId/validate
  @Patch('split/:splitId/validate')
  validateSplitPayment(@Param('splitId') splitId: string) {
    return this.expensesService.validateSplitPayment(splitId);
  }

  // Route: PATCH http://127.0.0.1:3000/expenses/split/:splitId/decline
  @Patch('split/:splitId/decline')
  declineSplitPayment(@Param('splitId') splitId: string) {
    return this.expensesService.declineSplitPayment(splitId);
  }

  // Route: POST http://127.0.0.1:3000/expenses/split/:splitId/proof
  @Post('split/:splitId/proof')
  @UseInterceptors(FileInterceptor('proof', {
    storage: proofStorage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Hanya file gambar yang diizinkan'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  }))
  uploadProof(
    @Param('splitId') splitId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File bukti pembayaran diperlukan');
    return this.expensesService.uploadProof(splitId, `/uploads/${file.filename}`);
  }
}