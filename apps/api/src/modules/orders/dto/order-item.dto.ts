import { IsInt, IsPositive, IsString } from 'class-validator';

export class OrderItemDto {
  @IsString()
  ticketTypeId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
