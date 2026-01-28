import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  venue!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  bannerUrl?: string;
}
