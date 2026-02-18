import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsBoolean,
  Matches,
  ValidateIf,
} from 'class-validator';

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

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsBoolean()
  refundAllowed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  refundWindowHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  refundFeePercent?: number;

  @IsOptional()
  @IsString()
  @ValidateIf((_, value) => typeof value === 'string' && /^https?:\/\//i.test(value))
  @IsUrl()
  @ValidateIf((_, value) => typeof value === 'string' && !/^https?:\/\//i.test(value))
  @Matches(/^[a-zA-Z0-9/_-][a-zA-Z0-9._/-]*$/, {
    message: 'bannerUrl must be a URL address or storage key',
  })
  bannerUrl?: string;
}
