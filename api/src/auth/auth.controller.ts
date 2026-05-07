import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

type LoginBody = {
  email?: string;
  password?: string;
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
}
