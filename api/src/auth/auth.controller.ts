import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

type LoginBody = {
  email?: string;
  password?: string;
};

type CreateUserBody = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginBody) {
    return this.authService.login(body.email ?? '', body.password ?? '');
  }

  @Get('me')
  async me(@Req() req: { user: { userId: string } }) {
    const user = await this.authService.me(req.user.userId);
    return { user };
  }

  @Get('users')
  async listUsers(@Req() req: { user: { userId: string; email: string; role: string; name: string | null } }) {
    const users = await this.authService.listUsers(req.user);
    return { users };
  }

  @Post('users')
  async createUser(
    @Req() req: { user: { userId: string; email: string; role: string; name: string | null } },
    @Body() body: CreateUserBody,
  ) {
    const user = await this.authService.createUser(req.user, body);
    return { user };
  }
}
