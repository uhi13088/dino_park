import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TossLoginDto {
  @ApiProperty({ description: '토스 유저 ID' })
  @IsString()
  tossId!: string;

  @ApiProperty({ description: '닉네임 (신규 가입 시)', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;
}
