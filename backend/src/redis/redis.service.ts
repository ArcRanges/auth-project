import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    try {
      // Test Redis connection
      await this.set('health-check', 'ok', 10);
      const result = await this.get<string>('health-check');
      if (result === 'ok') {
        this.logger.log('Redis connection established successfully');
      }
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * Get a value from Redis
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      return undefined;
    }
  }

  /**
   * Set a value in Redis with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      } else {
        await this.cacheManager.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Delete a value from Redis
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined && value !== null;
    } catch (error) {
      this.logger.error(`Failed to check existence of key: ${key}`, error);
      return false;
    }
  }

  /**
   * Reset/clear all cache (removes all keys)
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v6+ exposes `clear()`, which delegates to each store's `reset()` implementation (if provided).
      await this.cacheManager.clear();
      this.logger.log('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Failed to reset cache', error);
      throw error;
    }
  }

  /**
   * Store JSON data in Redis
   */
  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, value, ttl);
  }

  /**
   * Retrieve JSON data from Redis
   */
  async getJson<T>(key: string): Promise<T | undefined> {
    return this.get<T>(key);
  }

  /**
   * Increment a counter in Redis
   */
  async increment(key: string, ttl?: number): Promise<number> {
    try {
      const current = (await this.get<number>(key)) || 0;
      const newValue = current + 1;
      await this.set(key, newValue, ttl);
      return newValue;
    } catch (error) {
      this.logger.error(`Failed to increment key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Add an item to a set in Redis
   */
  async addToSet(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const set = (await this.get<string[]>(key)) || [];
      if (!set.includes(value)) {
        set.push(value);
        await this.set(key, set, ttl);
      }
    } catch (error) {
      this.logger.error(`Failed to add to set: ${key}`, error);
      throw error;
    }
  }

  /**
   * Get all items from a set in Redis
   */
  async getSet(key: string): Promise<string[]> {
    return (await this.get<string[]>(key)) || [];
  }

  /**
   * Remove an item from a set in Redis
   */
  async removeFromSet(key: string, value: string): Promise<void> {
    try {
      const set = (await this.get<string[]>(key)) || [];
      const filtered = set.filter((item) => item !== value);
      if (filtered.length === 0) {
        await this.delete(key);
      } else {
        await this.set(key, filtered);
      }
    } catch (error) {
      this.logger.error(`Failed to remove from set: ${key}`, error);
      throw error;
    }
  }
}
