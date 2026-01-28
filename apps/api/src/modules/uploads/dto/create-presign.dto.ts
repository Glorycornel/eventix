import { IsOptional, IsString } from 'class-validator';

export class CreatePresignDto {
  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;

  @IsOptional()
  @IsString()
  folder?: string;
}
