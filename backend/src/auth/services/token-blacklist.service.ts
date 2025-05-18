import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly keyPrefix = 'token:blacklist:';

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Add a token to the blacklist
   * @param token The token to blacklist
   * @param expiresIn Time in seconds until the token expires
   */
  async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    try {
      const key = `${this.keyPrefix}${token}`;
      await this.redis.set(key, '1', 'EX', expiresIn);
      this.logger.debug(`Token added to blacklist with expiry of ${expiresIn} seconds`);
    } catch (error) {
      this.logger.error(`Failed to add token to blacklist: ${error.message}`, error.stack);
      // Don't throw, as blacklisting is a secondary security measure
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token The token to check
   * @returns True if the token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = `${this.keyPrefix}${token}`;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`, error.stack);
      // In case of error, assume token is not blacklisted to avoid blocking legitimate requests
      return false;
    }
  }

  /**
   * Remove a token from the blacklist
   * @param token The token to remove
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = `${this.keyPrefix}${token}`;
      await this.redis.del(key);
      this.logger.debug('Token removed from blacklist');
    } catch (error) {
      this.logger.error(`Failed to remove token from blacklist: ${error.message}`, error.stack);
    }
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  async clearBlacklist(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cleared ${keys.length} tokens from blacklist`);
      }
    } catch (error) {
      this.logger.error(`Failed to clear token blacklist: ${error.message}`, error.stack);
    }
  }
}
