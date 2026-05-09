import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Simple root response for connectivity checks.
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
