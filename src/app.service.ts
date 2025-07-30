import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Esusu-Confam-Ltd API version 1.0';
  }
}
