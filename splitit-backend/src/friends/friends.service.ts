import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddFriendDto, RespondFriendDto } from './dto/create-friend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  // kirim friend request
  async sendFriendRequest(data: AddFriendDto) {
    // cek sender valid dulu
    const requester = await this.prisma.user.findUnique({
      where: { id: data.requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Sender ID not found in the database. Please log in again.');
    }

    // cari target user by nama atau email
    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: data.friendEmailOrName },
          { email: data.friendEmailOrName },
          { name: data.friendEmailOrName },
        ],
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found!');
    }

    if (targetUser.id === data.requesterId) {
      throw new BadRequestException('You cannot add yourself.');
    }

    // cek udah temenan atau belom
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: data.requesterId, friendId: targetUser.id },
          { userId: targetUser.id, friendId: data.requesterId },
        ],
      },
    });

    if (existingFriendship) {
      throw new BadRequestException('Friend request already exists or you are already friends.');
    }

    // bikin friend request baru
    const newRequest = await this.prisma.friendship.create({
      data: {
        userId: data.requesterId,
        friendId: targetUser.id,
        status: 'PENDING',
      },
    });

    return { message: 'Friend request sent successfully!', data: newRequest };
  }

  // lihat siapa yang nge-add kamu
  async getPendingRequests(userId: string) {
    // cari pending request yang masuk
    return this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getNotifications(userId: string) {
    const pendingRequests = await this.getPendingRequests(userId);
    return pendingRequests.map((request) => ({
      id: request.id,
      type: 'FRIEND_REQUEST',
      message: `${request.user.name} sent you a friend request.`,
      user: request.user,
      createdAt: request.createdAt,
    }));
  }

  async getAcceptedFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userId: userId },
          { friendId: userId },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        friend: { select: { id: true, name: true, email: true } },
      },
    });

    return friendships.map((friendship) => {
      const otherUser = friendship.userId === userId ? friendship.friend : friendship.user;
      return {
        id: friendship.id,
        status: friendship.status,
        friendId: otherUser.id,
        friend: otherUser,
      };
    });
  }

  // accept atau decline request
  async respondToRequest(data: RespondFriendDto) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: data.friendshipId },
    });

    if (!friendship || friendship.friendId !== data.userId) {
      throw new NotFoundException('Invalid friend request.');
    }

    if (data.status === 'DECLINED') {
      // kalau decline, hapus dari DB
      await this.prisma.friendship.delete({
        where: { id: data.friendshipId },
      });
      return { message: 'Friend request rejected.' };
    }

    // kalau accept, update statusnya
    const updatedFriendship = await this.prisma.friendship.update({
      where: { id: data.friendshipId },
      data: { status: 'ACCEPTED' },
    });

    return { message: 'Friend request accepted!', data: updatedFriendship };
  }

  // hapus pertemanan
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found.');
    }

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      throw new BadRequestException('You are not authorized to remove this friend.');
    }

    await this.prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return { message: 'Friend removed successfully.' };
  }
}