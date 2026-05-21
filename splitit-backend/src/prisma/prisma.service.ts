import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/splitit_db';
    const url = new URL(dbUrl);

    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password || undefined,
      database: url.pathname.slice(1),
    });

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}