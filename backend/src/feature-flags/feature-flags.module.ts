import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { FeatureFlagGuard } from './guards/feature-flag.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureFlag]),
  ],
  controllers: [FeatureFlagController],
  providers: [
    FeatureFlagService,
    FeatureFlagGuard,
  ],
  exports: [
    FeatureFlagService,
    FeatureFlagGuard,
  ],
})
export class FeatureFlagsModule {}