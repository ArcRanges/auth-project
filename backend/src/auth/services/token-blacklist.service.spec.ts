import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '../../redis/redis.service';
import { TokenBlacklistService } from './token-blacklist.service';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  const redisService = {
    set: jest.fn(),
    exists: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('addToBlacklist stores a hashed key with TTL seconds', async () => {
    await service.addToBlacklist('token-value', 123.7);
    expect(redisService.set).toHaveBeenCalledTimes(1);
    expect(redisService.set.mock.calls[0][0]).toMatch(/^auth:blacklist:[0-9a-f]{64}$/);
    expect(redisService.set.mock.calls[0][1]).toBe(true);
    expect(redisService.set.mock.calls[0][2]).toBe(123);
  });

  it('isBlacklisted checks existence of hashed key', async () => {
    redisService.exists.mockResolvedValueOnce(true);
    await expect(service.isBlacklisted('token-value')).resolves.toBe(true);
    expect(redisService.exists).toHaveBeenCalledTimes(1);
    expect(redisService.exists.mock.calls[0][0]).toMatch(/^auth:blacklist:[0-9a-f]{64}$/);
  });

  it('removeFromBlacklist deletes hashed key', async () => {
    await service.removeFromBlacklist('token-value');
    expect(redisService.delete).toHaveBeenCalledTimes(1);
    expect(redisService.delete.mock.calls[0][0]).toMatch(/^auth:blacklist:[0-9a-f]{64}$/);
  });
});

