import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RisksModule } from './risks/risks.module';

@Module({
  // App-level wiring for config, DB client, and feature modules.
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RisksModule,
  ],
})
export class AppModule {}
