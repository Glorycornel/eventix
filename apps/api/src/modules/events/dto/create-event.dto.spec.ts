import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEventDto } from './create-event.dto';

describe('CreateEventDto', () => {
  const validPayload = {
    title: 'Event title',
    description: 'Event description',
    venue: 'Venue',
    city: 'Lagos',
    category: 'Music',
    subcategory: 'Afrobeats',
    startAt: '2026-04-10T10:00:00.000Z',
    endAt: '2026-04-10T12:00:00.000Z',
    capacity: 100,
    refundAllowed: true,
    refundWindowHours: 24,
    refundFeePercent: 10,
  };

  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateEventDto, validPayload);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects refundFeePercent above 100', async () => {
    const dto = plainToInstance(CreateEventDto, {
      ...validPayload,
      refundFeePercent: 120,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'refundFeePercent')).toBe(true);
  });

  it('accepts bannerUrl as full url or storage key', async () => {
    const urlDto = plainToInstance(CreateEventDto, {
      ...validPayload,
      bannerUrl: 'https://cdn.example.com/banner.png',
    });
    const keyDto = plainToInstance(CreateEventDto, {
      ...validPayload,
      bannerUrl: 'uploads/banner.png',
    });
    expect(await validate(urlDto)).toHaveLength(0);
    expect(await validate(keyDto)).toHaveLength(0);
  });
});
