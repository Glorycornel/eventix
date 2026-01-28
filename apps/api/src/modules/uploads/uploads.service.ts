import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private readonly bucket: string | null;
  private readonly publicUrl: string | null;
  private readonly client: S3Client | null;

  constructor(private readonly config: ConfigService) {
    const accessKeyId = config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = config.get<string>('S3_SECRET_KEY');
    const endpoint = config.get<string>('S3_ENDPOINT');
    const region = config.get<string>('S3_REGION') || 'auto';
    const bucket = config.get<string>('S3_BUCKET');
    const publicUrl = config.get<string>('S3_PUBLIC_URL') || null;

    this.bucket = bucket || null;
    this.publicUrl = publicUrl;
    this.client =
      accessKeyId && secretAccessKey && bucket
        ? new S3Client({
            region,
            endpoint: endpoint || undefined,
            forcePathStyle: Boolean(endpoint),
            credentials: {
              accessKeyId,
              secretAccessKey
            }
          })
        : null;
  }

  async createPresignedUpload(params: {
    filename: string;
    contentType: string;
    folder?: string;
  }) {
    if (!this.client || !this.bucket) {
      throw new InternalServerErrorException('S3 credentials not configured');
    }

    const safeName = params.filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const folder = params.folder?.replace(/[^a-zA-Z0-9/_-]/g, '') || 'events';
    const key = `${folder}/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 600
    });

    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const fallbackPublicUrl =
      this.publicUrl || (endpoint ? `${endpoint}/${this.bucket}/${key}` : null);

    return {
      uploadUrl,
      key,
      publicUrl: fallbackPublicUrl
    };
  }
}
