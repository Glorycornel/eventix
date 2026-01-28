import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePresignDto } from './dto/create-presign.dto';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  createPresign(@Body() body: CreatePresignDto) {
    return this.uploadsService.createPresignedUpload({
      filename: body.filename,
      contentType: body.contentType,
      folder: body.folder
    });
  }
}
