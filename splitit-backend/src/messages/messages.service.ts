import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAcceptedFriendship(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (!friendship) {
      throw new NotFoundException('You can only chat with an accepted friend.');
    }

    return friendship;
  }

  async getConversation(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Cannot create a conversation with yourself.');
    }

    await this.ensureAcceptedFriendship(userId, friendId);

    // tandain pesan dari temen sebagai read
    await this.prisma.message.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(data: SendMessageDto) {
    if (data.senderId === data.receiverId) {
      throw new BadRequestException('Cannot send a message to yourself.');
    }

    await this.ensureAcceptedFriendship(data.senderId, data.receiverId);

    return this.prisma.message.create({
      data: {
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
      },
    });
  }

  async getUnreadCounts(userId: string) {
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        isRead: false,
      },
      _count: {
        id: true,
      },
    });

    return unreadCounts.map((count) => ({
      friendId: count.senderId,
      unreadCount: count._count.id,
    }));
  }
}
