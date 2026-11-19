import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  IsUUID,
} from 'class-validator';
import { REPEAT_SYNTHESIS_FOCI, type RepeatSynthesisFocus } from '@dino-park/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MilestoneSynthesisService } from './milestone-synthesis.service';
import { RepeatSynthesisService } from './repeat-synthesis.service';

class StartMilestoneSynthesisDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ArrayUnique()
  @IsString({ each: true })
  parentIds!: string[];
}

class StartRepeatSynthesisDto extends StartMilestoneSynthesisDto {
  @IsIn([...REPEAT_SYNTHESIS_FOCI])
  focus!: RepeatSynthesisFocus;

  @IsUUID('4')
  requestId!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('milestone-synthesis')
export class MilestoneSynthesisController {
  constructor(
    private readonly synthesis: MilestoneSynthesisService,
    private readonly repeat: RepeatSynthesisService,
  ) {}

  @Get() state(@CurrentUser('id') userId: string) {
    return this.synthesis.getState(userId);
  }

  @Post('safety') completeSafety(@CurrentUser('id') userId: string) {
    return this.synthesis.completeSafety(userId);
  }

  @Post('prepare') prepare(@CurrentUser('id') userId: string) {
    return this.synthesis.prepare(userId);
  }

  @Post('start') start(@CurrentUser('id') userId: string, @Body() dto: StartMilestoneSynthesisDto) {
    return this.synthesis.start(userId, dto.parentIds);
  }

  @Post('claim') claim(@CurrentUser('id') userId: string) {
    return this.synthesis.claim(userId);
  }

  @Get('repeat') repeatState(@CurrentUser('id') userId: string) {
    return this.repeat.status(userId);
  }

  @Post('repeat/start') startRepeat(
    @CurrentUser('id') userId: string,
    @Body() dto: StartRepeatSynthesisDto,
  ) {
    return this.repeat.start(userId, dto);
  }

  @Post('repeat/:id/claim') claimRepeat(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.repeat.claim(userId, id);
  }
}
