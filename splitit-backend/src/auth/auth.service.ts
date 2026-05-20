import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // register user baru
  async register(data: RegisterDto) {
    // cek email udah ada belom
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email has been used, please use another email!');
    }

    // hash password pake bcrypt
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // simpan ke DB
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword, // Simpan password yang sudah diacak!
      },
    });

    // return tanpa password
    const { password, ...result } = newUser;
    return result;
  }

  // login user
  async login(data: LoginDto) {
    // cari user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect!');
    }

    // bandingkan password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email or password is incorrect!');
    }

    // return data tanpa password
    const { password, ...result } = user;
    return {
      message: 'Successfully logged in!',
      user: result,
    };
  }

  // ambil profile dari cookie
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
}