import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK v3
const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
    region: 'auto'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'klinic-bucket';

// Generate a presigned URL for file upload
export const generateUploadUrlProfile = async (fileType: string, fileName: string, role: string, userId: string): Promise<string> => {
    try {
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const key = `${role}/${userId}/${uniqueFileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: getMimeType(fileExtension || '')
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
        return uploadUrl;
    } catch (error) {
        console.error('Error generating upload URL:', error);
        throw new Error('Failed to generate upload URL');
    }
};

// Helper function to determine MIME type based on file extension
const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}; 