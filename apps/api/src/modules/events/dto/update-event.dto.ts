import { IsDateString, IsOptional, IsString, IsUrl, Matches, ValidateIf } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

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
