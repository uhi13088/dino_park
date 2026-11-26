import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ParkService } from './park.service';
import {
  IsString,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsUUID,
  Max,
  Min,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  PARK_ENTRANCE_SIDES,
  PARK_SHUTTLE,
  type BuyShuttleBusRequest,
  type MoveParkEntranceRequest,
  type ParkEntranceSide,
  type SetShuttleRouteRequest,
  type ShuttleDepartureInterval,
  type SafariLayout,
  type SaveParkSafariRequest,
} from '@dino-park/shared';
import { ParkOperationsService } from './park-operations.service';
import { ParkShuttleService } from './park-shuttle.service';
import { ParkSafariService } from './park-safari.service';

class ParkOpenDto {
  @IsBoolean() isOpen!: boolean;
}
class EntrancePositionDto implements MoveParkEntranceRequest {
  @IsInt() @Min(0) positionX!: number;
  @IsInt() @Min(0) positionY!: number;

  @ApiProperty({
    description: '입구가 닿는 파크 테두리',
    enum: PARK_ENTRANCE_SIDES,
    required: false,
  })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsIn(PARK_ENTRANCE_SIDES)
  side?: ParkEntranceSide;
}

class RenameParkDto {
  @ApiProperty({ description: '파크 이름', example: '공룡 왕국', minLength: 2, maxLength: 20 })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name!: string;
}

class BuyShuttleBusDto implements BuyShuttleBusRequest {
  @IsUUID('4') requestId!: string;
}

class SetShuttleRouteDto implements SetShuttleRouteRequest {
  @IsInt() @Min(0) @Max(PARK_SHUTTLE.maxBuses) busCount!: number;
  @IsIn(PARK_SHUTTLE.departureIntervals) departureIntervalSeconds!: ShuttleDepartureInterval;
}

class SaveParkSafariDto implements SaveParkSafariRequest {
  @IsInt() @Min(0) revision!: number;
  @IsObject() layout!: SafariLayout;
}

@ApiTags('parks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('parks')
export class ParkController {
  constructor(
    private readonly parkService: ParkService,
    private readonly operations: ParkOperationsService,
    private readonly shuttle: ParkShuttleService,
    private readonly safari: ParkSafariService,
  ) {}

  @Get('me/operations')
  getOperations(@CurrentUser('id') userId: string) {
    return this.operations.getOperations(userId);
  }

  @Get('me/safari')
  getSafari(@CurrentUser('id') userId: string) {
    return this.safari.get(userId);
  }

  @Put('me/safari')
  saveSafari(@CurrentUser('id') userId: string, @Body() dto: SaveParkSafariDto) {
    return this.safari.save(userId, dto.revision, dto.layout);
  }

  @Post('me/shuttle/vehicles')
  buyShuttleBus(@CurrentUser('id') userId: string, @Body() dto: BuyShuttleBusDto) {
    return this.shuttle.buyVehicle(userId, dto.requestId);
  }

  @Put('me/shuttle/routes/:exhibitId')
  setShuttleRoute(
    @CurrentUser('id') userId: string,
    @Param('exhibitId') exhibitId: string,
    @Body() dto: SetShuttleRouteDto,
  ) {
    return this.shuttle.setRoute(userId, exhibitId, dto);
  }

  @Patch('me/open')
  setOpen(@CurrentUser('id') userId: string, @Body() dto: ParkOpenDto) {
    return this.operations.setOpen(userId, dto.isOpen);
  }

  @Patch('me/entrance')
  moveEntrance(@CurrentUser('id') userId: string, @Body() dto: EntrancePositionDto) {
    return this.operations.moveEntrance(userId, dto.positionX, dto.positionY, dto.side);
  }

  @Post('me/starter')
  @ApiOperation({ summary: '빈 파크에 시작 공룡과 기본 시설을 한 번 지급' })
  async claimStarter(@CurrentUser('id') userId: string) {
    return this.parkService.claimStarter(userId);
  }

  /**
   * 내 파크 전체 조회 (공룡, 건물 포함)
   */
  @Get('me')
  @ApiOperation({ summary: '내 파크 조회 (전체)' })
  @ApiResponse({
    status: 200,
    description: '파크 전체 정보 (공룡, 건물 포함)',
    schema: {
      example: {
        id: 'clx1234...',
        name: '멋진 공룡 파크',
        level: 5,
        exp: 800,
        expForNextLevel: 1520,
        gridSizeX: 28,
        gridSizeY: 28,
        maxGridSize: 28,
        dinosaurs: [{ id: '...', speciesId: 'triceratops', level: 3 }],
        buildings: [{ id: '...', typeId: 'visitor_center', level: 2 }],
      },
    },
  })
  async getMyPark(@CurrentUser('id') userId: string) {
    return this.parkService.getByUserId(userId);
  }

  /**
   * 내 파크 요약 조회 (메인 화면용)
   */
  @Get('me/summary')
  @ApiOperation({ summary: '내 파크 요약 조회' })
  @ApiResponse({
    status: 200,
    description: '파크 요약 정보',
    schema: {
      example: {
        id: 'clx1234...',
        name: '멋진 공룡 파크',
        level: 5,
        exp: 800,
        expForNextLevel: 1520,
        gridSizeX: 28,
        gridSizeY: 28,
        dinosaurCount: 12,
        buildingCount: 8,
      },
    },
  })
  async getParkSummary(@CurrentUser('id') userId: string) {
    return this.parkService.getSummary(userId);
  }

  /**
   * 파크 이름 변경
   */
  @Patch('me/name')
  @ApiOperation({ summary: '파크 이름 변경' })
  @ApiResponse({ status: 200, description: '이름 변경 완료' })
  async renamePark(@CurrentUser('id') userId: string, @Body() dto: RenameParkDto) {
    return this.parkService.rename(userId, dto.name);
  }

  /**
   * 파크 수익 정보 조회
   */
  @Get('me/revenue')
  @ApiOperation({ summary: '파크 수익 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '파크 수익 정보',
    schema: {
      example: {
        grossRevenue: 15000,
        maintenanceCost: 1500,
        netRevenue: 13500,
        revenuePerMinute: 225,
        dinosaurCount: 12,
        buildingCount: 8,
        buildingBonus: 40,
      },
    },
  })
  async getParkRevenue(@CurrentUser('id') userId: string) {
    return this.parkService.calculateRevenue(userId);
  }
}
