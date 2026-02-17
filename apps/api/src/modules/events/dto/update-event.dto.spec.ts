import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateEventDto } from './update-event.dto';

describe('UpdateEventDto', () => {
  it('accepts empty payload because all fields are optional', async () => {
    const dto = plainToInstance(UpdateEventDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid capacity', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      capacity: 0,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'capacity')).toBe(true);
  });
});
