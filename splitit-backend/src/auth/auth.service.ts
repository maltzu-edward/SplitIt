import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  
  async register(data: RegisterDto) {
    
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email has been used, please use another email!');
    }

    
    const hashedPassword = await bcrypt.hash(data.password, 10);

    
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword, 
      },
    });

    
    const { password, ...result } = newUser;
    return result;
  }

  
  async login(data: LoginDto) {
    
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect!');
    }

    
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect!');
    }

    
    const { password, ...result } = user;
    return {
      message: 'Successfully logged in!',
      user: result,
    };
  }

  
  async fetchProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please log in again.');
    }

    const { password, ...result } = user;
    return { user: result };
  }

  async updateProfile(userId: string, name?: string, profileImage?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(name ? { name } : {}),
        ...(profileImage ? { profileImage } : {}),
      },
    });

    const { password, ...result } = updatedUser;
    return { user: result };
  }
}