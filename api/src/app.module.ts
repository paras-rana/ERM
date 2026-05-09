import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RisksModule } from './risks/risks.module';

@Module({
  // App-level wiring for config, DB client, and feature modules.
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'api/.env'],
    }),
    PrismaModule,
    AuthModule,
    RisksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
