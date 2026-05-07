import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Placeholder root response.
  getHello(): string {
    return 'Hello World!';
  }
}
