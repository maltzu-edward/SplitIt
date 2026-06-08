import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  
  @Post('expense')
  addExpense(@Body() createExpenseDto: CreateExpenseDto) {
    return this.groupsService.addExpense(createExpenseDto);
  }

  
  @Post()
  createGroup(@Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(createGroupDto);
  }

  
  @Get('user/:userId')
  getUserGroups(@Param('userId') userId: string) {
    return this.groupsService.getUserGroups(userId);
  }

  
  @Get(':groupId')
  getGroupDetail(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupDetail(groupId);
  }

  
  @Delete(':groupId/user/:userId')
  leaveGroup(@Param('groupId') groupId: string, @Param('userId') userId: string) {
    return this.groupsService.leaveGroup(groupId, userId);
  }

  
  @Post(':groupId/members')
  addMembers(
    @Param('groupId') groupId: string,
    @Body('memberIds') memberIds: string[],
  ) {
    return this.groupsService.addMembers(groupId, memberIds);
  }
}