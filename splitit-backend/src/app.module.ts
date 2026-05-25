import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { FriendsModule } from './friends/friends.module';
import { GroupsModule } from './groups/groups.module';
import { ExpensesModule } from './expenses/expenses.module';
import { MessagesModule } from './messages/messages.module';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [AuthModule, PrismaModule, FriendsModule, GroupsModule, ExpensesModule, MessagesModule, OcrModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
