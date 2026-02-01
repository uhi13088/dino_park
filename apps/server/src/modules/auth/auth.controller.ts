import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TossLoginDto } from './dto/toss-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('toss/login')
  @ApiOperation({ summary: '토스 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  async tossLogin(@Body() dto: TossLoginDto) {
    return this.authService.tossLogin(dto);
  }
}
