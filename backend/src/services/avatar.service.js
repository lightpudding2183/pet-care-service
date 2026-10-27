const { randomUUID } = require('node:crypto');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const AppError = require('../utils/error');

const ALLOWED_CONTENT_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

class AvatarService {
  async createUploadUrl(userId, contentType) {
    const extension = ALLOWED_CONTENT_TYPES.get(contentType);
    if (!extension) {
      throw new AppError('Avatar must be a JPEG, PNG, or WebP image', 400);
    }

    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      throw new AppError('Avatar storage is not configured', 503);
    }

    const key = `avatars/${userId}/${randomUUID()}.${extension}`;
    const client = new S3Client({ region });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const baseUrl = process.env.S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;

    return {
      uploadUrl,
      avatarUrl: `${baseUrl.replace(/\/$/, '')}/${key}`,
      key,
      expiresIn: 300
    };
  }
}

module.exports = new AvatarService();