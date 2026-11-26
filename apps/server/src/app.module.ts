import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ParkModule } from './modules/park/park.module';
import { DinosaurModule } from './modules/dinosaur/dinosaur.module';
import { BuildingModule } from './modules/building/building.module';
import { GreatFigureModule } from './modules/great-figure/great-figure.module';
import { ExplorationModule } from './modules/exploration/exploration.module';
import { StoryModule } from './modules/story/story.module';
import { ShopModule } from './modules/shop/shop.module';
import { SeasonModule } from './modules/season/season.module';
import { EconomyModule } from './modules/economy/economy.module';
import { SocialModule } from './modules/social/social.module';
import { MilestoneSynthesisModule } from './modules/milestone-synthesis/milestone-synthesis.module';
import { ResearchModule } from './modules/research/research.module';
import { ExperimentalHybridModule } from './modules/experimental-hybrid/experimental-hybrid.module';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Prisma (데이터베이스)
    PrismaModule,

    // 기능 모듈
    AuthModule,
    UserModule,
    ParkModule,
    DinosaurModule,
    BuildingModule,
    GreatFigureModule,
    ExplorationModule,
    MilestoneSynthesisModule,
    ExperimentalHybridModule,
    ResearchModule,
    StoryModule,
    ShopModule,
    SeasonModule,
    EconomyModule,
    SocialModule,
  ],
})
export class AppModule {}
