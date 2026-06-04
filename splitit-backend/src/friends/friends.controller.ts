import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { AddFriendDto, RespondFriendDto } from './dto/create-friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // Route: POST http://127.0.0.1:3000/friends/request
  @Post('request')
  sendFriendRequest(@Body() addFriendDto: AddFriendDto) {
    return this.friendsService.sendFriendRequest(addFriendDto);
  }

  // Route: GET http://127.0.0.1:3000/friends/pending/:userId
  @Get('pending/:userId')
  getPendingRequests(@Param('userId') userId: string) {
    return this.friendsService.getPendingRequests(userId);
  }

  // Route: GET http://127.0.0.1:3000/friends/notifications/:userId
  @Get('notifications/:userId')
  getNotifications(@Param('userId') userId: string) {
    return this.friendsService.getNotifications(userId);
  }

  // Route: GET http://127.0.0.1:3000/friends/accepted/:userId
  @Get('accepted/:userId')
  getAcceptedFriends(@Param('userId') userId: string) {
    return this.friendsService.getAcceptedFriends(userId);
  }

  // Route: PATCH http://127.0.0.1:3000/friends/respond
  @Patch('respond')
  respondToRequest(@Body() respondFriendDto: RespondFriendDto) {
    return this.friendsService.respondToRequest(respondFriendDto);
  }

  // Route: DELETE http://127.0.0.1:3000/friends/:friendshipId/:userId
  @Delete(':friendshipId/:userId')
  removeFriend(@Param('friendshipId') friendshipId: string, @Param('userId') userId: string) {
    return this.friendsService.removeFriend(userId, friendshipId);
  }
}
