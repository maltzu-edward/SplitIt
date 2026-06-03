import { Controller, Post, Body, Res, Get, Req, UnauthorizedException, Patch, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express'; // Use 'import type' to avoid TS1272 errors
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/create-auth.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const profileStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads');
    if (!existsSync(uploadPath)) mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${Date.now()}${extname(file.originalname)}`);
  },
});

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ) {
    // validasi email & password dulu
    const result = await this.authService.login(loginDto);

    // bikin JWT token terus set cookie
    const jwtSecret = process.env.JWT_SECRET || 'SUPER_SECRET_KEY';
    const token = jwt.sign(
      { sub: result.user.id, email: result.user.email },
      jwtSecret,
      { expiresIn: '24h' }
    );

    response.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set true in production HTTPS
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    // cookie userId buat kompatibilitas
    response.cookie('userId', result.user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return { ...result, token };
  }

  @Get('profile')
  async fetchProfile(@Req() request: Request) {
    const tokenFromCookie = request.cookies['token'];
    const authHeader = request.headers['authorization'];
    const tokenFromHeader = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new UnauthorizedException('Please log in first.');
    }

    const jwtSecret = process.env.JWT_SECRET || 'SUPER_SECRET_KEY';

    let payload: any;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token. Please log in again.');
    }

    return this.authService.fetchProfile(payload.sub);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('token');
    response.clearCookie('userId');
    return { message: 'Logout successful' };
  }

  @Patch('profile/:userId')
  @UseInterceptors(FileInterceptor('profileImage', {
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Only image files are allowed'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  }))
  async updateProfile(
    @Param('userId') userId: string,
    @Body('name') name: string,
    @UploadedFile() file: any,
  ) {
    const profileImagePath = file ? `/uploads/${file.filename}` : undefined;
    return this.authService.updateProfile(userId, name, profileImagePath);
  }
}