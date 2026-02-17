import { ConfigService } from '@nestjs/config';
import { VerificationService } from './verification.service';

const redisMock = {
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => redisMock),
}));

describe('VerificationService', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        REDIS_URL: 'redis://localhost:6379',
        EMAIL_VERIFY_TTL_SECONDS: '3600',
        EMAIL_OTP_TTL_SECONDS: '120',
        EMAIL_OTP_MAX_ATTEMPTS: '2',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  let service: VerificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VerificationService(config);
  });

  it('creates and consumes OTP successfully', async () => {
    redisMock.get.mockResolvedValueOnce(
      JSON.stringify({
        userId: 'user-1',
        otpHash: 'a',
        attempts: 0,
      }),
    );

    const hashSpy = jest
      .spyOn<any, any>(service as any, 'hashOtp')
      .mockReturnValueOnce('a')
      .mockReturnValueOnce('a');

    const otp = await service.createOtp('user@example.com', 'user-1');
    expect(otp).toHaveLength(6);
    expect(redisMock.setex).toHaveBeenCalledTimes(1);

    const userId = await service.consumeOtp('user@example.com', otp);
    expect(userId).toBe('user-1');
    expect(redisMock.del).toHaveBeenCalledTimes(1);
    expect(hashSpy).toHaveBeenCalled();
  });

  it('increments attempts and deletes OTP after max attempts', async () => {
    redisMock.get
      .mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          otpHash: 'expected',
          attempts: 0,
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          userId: 'user-1',
          otpHash: 'expected',
          attempts: 1,
        }),
      );

    jest.spyOn<any, any>(service as any, 'hashOtp').mockReturnValue('wrong');

    const first = await service.consumeOtp('user@example.com', '000000');
    expect(first).toBeNull();
    expect(redisMock.setex).toHaveBeenCalled();

    const second = await service.consumeOtp('user@example.com', '000000');
    expect(second).toBeNull();
    expect(redisMock.del).toHaveBeenCalled();
  });

  it('creates and consumes link token', async () => {
    const token = await service.createToken('user-1');
    expect(token).toHaveLength(64);
    expect(redisMock.setex).toHaveBeenCalled();

    redisMock.get.mockResolvedValueOnce('user-1');
    const userId = await service.consumeToken(token);
    expect(userId).toBe('user-1');
    expect(redisMock.del).toHaveBeenCalled();
  });
});
