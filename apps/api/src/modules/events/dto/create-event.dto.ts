import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

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
