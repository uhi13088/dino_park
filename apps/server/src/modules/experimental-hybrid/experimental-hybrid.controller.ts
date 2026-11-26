import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD,
  EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD,
  Rarity,
  REPEAT_SYNTHESIS_FOCI,
} from '@dino-park/shared';
import type {
  ExperimentalHybridSelection,
  ExperimentalHybridStart,
  ExperimentalHybridTier,
  RepeatSynthesisFocus,
} from '@dino-park/shared';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExperimentalHybridService } from './experimental-hybrid.service';

class HybridQuoteDto implements ExperimentalHybridSelection {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  parentIds!: [string, string];

  @IsIn([...REPEAT_SYNTHESIS_FOCI])
  focus!: RepeatSynthesisFocus;

  @IsIn([Rarity.EPIC, Rarity.LEGENDARY])
  tier!: ExperimentalHybridTier;

  @IsOptional()
  @IsBoolean()
  stabilizer?: boolean;
}

class HybridStartDto extends HybridQuoteDto implements ExperimentalHybridStart {
  @IsUUID('4')
  requestId!: string;
}

class HybridListingDto {
  @IsString()
  @MaxLength(100)
  lineageId!: string;

  @IsInt()
  @Min(EXPERIMENTAL_HYBRID_LISTING_MIN_GOLD)
  @Max(EXPERIMENTAL_HYBRID_LISTING_MAX_GOLD)
  price!: number;

  @IsUUID('4')
  requestId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('experimental-hybrids')
export class ExperimentalHybridController {
  constructor(private readonly hybrids: ExperimentalHybridService) {}

  @Get()
  state(@CurrentUser('id') userId: string) {
    return this.hybrids.state(userId);
  }

  @Post('quote')
  quote(@CurrentUser('id') userId: string, @Body() dto: HybridQuoteDto) {
    return this.hybrids.quote(userId, dto);
  }

  @Post('start')
  start(@CurrentUser('id') userId: string, @Body() dto: HybridStartDto) {
    return this.hybrids.start(userId, dto);
  }

  @Post('jobs/:id/claim')
  claim(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.hybrids.claim(userId, id);
  }

  @Post('archive/recover')
  recoverArchive(@CurrentUser('id') userId: string) {
    return this.hybrids.recoverArchive(userId);
  }

  @Post('listings')
  listDocument(@CurrentUser('id') userId: string, @Body() dto: HybridListingDto) {
    return this.hybrids.listDocument(userId, dto.lineageId, dto.price, dto.requestId);
  }

  @Delete('listings/:id')
  cancelListing(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.hybrids.cancelListing(userId, id);
  }

  @Post('listings/:id/buy')
  buyDocument(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.hybrids.buyDocument(userId, id);
  }

  @Post('market/collect')
  collectProceeds(@CurrentUser('id') userId: string) {
    return this.hybrids.collectProceeds(userId);
  }
}

@Controller('experimental-hybrids/art')
export class ExperimentalHybridArtworkController {
  constructor(private readonly hybrids: ExperimentalHybridService) {}

  @Get(':id')
  async artwork(@Param('id') id: string, @Res() response: Response) {
    const artwork = await this.hybrids.artwork(id);
    response.type('png').set('Cache-Control', 'public, max-age=31536000, immutable').send(artwork);
  }
}
