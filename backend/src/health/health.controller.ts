// src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { MODEL, getProfileList } from '../config/dani.config';

@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    const keySet = !!process.env.GROQ_API_KEY;
    return {
      status: 'ok',
      model: MODEL,
      api_key: keySet ? 'set' : 'missing',
    };
  }

  @Get('profiles')
  profiles() {
    return getProfileList();
  }
}
