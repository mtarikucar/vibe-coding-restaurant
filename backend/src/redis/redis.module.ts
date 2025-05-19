import { Module, DynamicModule, Global, Provider } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule as NestRedisModule } from "@nestjs-modules/ioredis";
import Redis from "ioredis";

@Global()
@Module({})
export class RedisModule {
  static forRoot(): DynamicModule {
    const redisProvider: Provider = {
      provide: "IOREDIS_CLIENT",
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get("REDIS_HOST", "localhost");
        const redisPort = configService.get("REDIS_PORT", "6379");
        return new Redis(`redis://${redisHost}:${redisPort}`);
      },
      inject: [ConfigService],
    };

    return {
      module: RedisModule,
      imports: [
        NestRedisModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: "single",
            url: `redis://${configService.get("REDIS_HOST", "localhost")}:${configService.get("REDIS_PORT", "6379")}`,
          }),
        }),
        ConfigModule,
      ],
      providers: [redisProvider],
      exports: [NestRedisModule, redisProvider],
    };
  }
}
