import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreateTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;
}
