import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DinosaurService } from './dinosaur.service';
import { IsString, IsNumber, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

class UpdateNicknameDto {
  @ApiProperty({
    description: '공룡 닉네임',
    example: '렉스',
    required: false,
    minLength: 1,
    maxLength: 12,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(12)
  nickname?: string;
}

class MovePositionDto {
  @ApiProperty({ description: 'X 좌표', example: 10, minimum: 0 })
  @IsNumber()
  @Min(0)
  positionX!: number;

  @ApiProperty({ description: 'Y 좌표', example: 15, minimum: 0 })
  @IsNumber()
  @Min(0)
  positionY!: number;
}

class PlaceInParkDto {
  @ApiProperty({ description: 'X 좌표', example: 10, minimum: 0 })
  @IsNumber()
  @Min(0)
  positionX!: number;

  @ApiProperty({ description: 'Y 좌표', example: 15, minimum: 0 })
  @IsNumber()
  @Min(0)
  positionY!: number;
}

@ApiTags('dinosaurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dinosaurs')
export class DinosaurController {
  constructor(private readonly dinosaurService: DinosaurService) {}

  /**
   * 내 공룡 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '내 공룡 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '공룡 목록 (현재 상태 계산 포함)',
    schema: {
      example: [
        {
          id: 'clx1234...',
          speciesId: 'triceratops',
          nickname: '트리',
          level: 5,
          exp: 120,
          expForNextLevel: 279,
          happiness: 85,
          happinessStatus: 'happy',
          hunger: 30,
          hungerStatus: 'normal',
          intimacy: 250,
          positionX: 5,
          positionY: 10,
          isInPark: true,
        },
      ],
    },
  })
  async getMyDinosaurs(@CurrentUser('id') userId: string) {
    return this.dinosaurService.getByUserId(userId);
  }

  /**
   * 공룡 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '공룡 상세 조회' })
  @ApiParam({ name: 'id', description: '공룡 ID' })
  async getDinosaur(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dinosaurService.getById(id, userId);
  }

  /**
   * 공룡 수익 정보 조회
   */
  @Get(':id/revenue')
  @ApiOperation({ summary: '공룡 수익 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '공룡 수익 정보',
    schema: {
      example: {
        hourlyRevenue: 150,
        minuteRevenue: 2,
        level: 5,
        happiness: 85,
        happinessMultiplier: 92,
      },
    },
  })
  async getDinosaurRevenue(@Param('id') id: string) {
    return this.dinosaurService.calculateRevenue(id);
  }

  /**
   * 공룡 닉네임 변경
   */
  @Patch(':id/nickname')
  @ApiOperation({ summary: '공룡 닉네임 변경' })
  @ApiResponse({ status: 200, description: '닉네임 변경 완료' })
  async updateNickname(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNicknameDto,
  ) {
    return this.dinosaurService.updateNickname(id, userId, dto.nickname || '');
  }

  /**
   * 공룡 위치 이동
   */
  @Patch(':id/position')
  @ApiOperation({ summary: '공룡 위치 이동' })
  @ApiResponse({ status: 200, description: '이동 완료' })
  async moveDinosaur(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MovePositionDto,
  ) {
    return this.dinosaurService.move(id, userId, dto.positionX, dto.positionY);
  }

  /**
   * 공룡에게 먹이주기
   */
  @Post(':id/feed')
  @ApiOperation({ summary: '공룡에게 먹이주기 (골드 100 소모)' })
  @ApiResponse({
    status: 200,
    description: '먹이주기 완료',
    schema: {
      example: {
        id: 'clx1234...',
        happiness: 100,
        hunger: 0,
        goldSpent: 100,
        happinessGain: 20,
        hungerReduce: 100,
        intimacyGain: 5,
      },
    },
  })
  async feedDinosaur(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dinosaurService.feed(id, userId);
  }

  /**
   * 공룡 쓰다듬기/놀아주기
   */
  @Post(':id/interact')
  @ApiOperation({ summary: '공룡 쓰다듬기 (5분 쿨타임)' })
  @ApiResponse({
    status: 200,
    description: '상호작용 완료',
    schema: {
      example: {
        id: 'clx1234...',
        expGain: 15,
        happinessGain: 5,
        intimacyGain: 10,
        leveledUp: false,
      },
    },
  })
  async interactWithDinosaur(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dinosaurService.interact(id, userId);
  }

  /**
   * 공룡 파크에서 제거 (창고로)
   */
  @Post(':id/remove')
  @ApiOperation({ summary: '공룡을 파크에서 제거 (창고로 이동)' })
  @ApiResponse({ status: 200, description: '창고로 이동 완료' })
  async removeFromPark(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dinosaurService.removeFromPark(id, userId);
  }

  /**
   * 공룡 파크에 배치
   */
  @Post(':id/place')
  @ApiOperation({ summary: '공룡을 파크에 배치' })
  @ApiResponse({ status: 200, description: '배치 완료' })
  async placeInPark(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: PlaceInParkDto,
  ) {
    return this.dinosaurService.placeInPark(id, userId, dto.positionX, dto.positionY);
  }

  /**
   * 공룡 방생 (삭제)
   */
  @Delete(':id')
  @ApiOperation({ summary: '공룡 방생 (DNA 획득)' })
  @ApiResponse({
    status: 200,
    description: '방생 완료',
    schema: {
      example: {
        released: true,
        dnaReward: 25,
      },
    },
  })
  async releaseDinosaur(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dinosaurService.release(id, userId);
  }
}
