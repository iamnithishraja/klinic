import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK
const s3 = new AWS.S3({
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
    signatureVersion: 'v4',
    region: process.env.R2_REGION || 'auto'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'klinic-bucket';

// Generate a presigned URL for file upload
export const generateUploadUrl = async (fileType: string, fileName: string): Promise<string> => {
    try {
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const key = `uploads/${fileType}/${uniqueFileName}`;
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: getMimeType(fileExtension || ''),
            Expires: 3600 // URL expires in 1 hour
        };
        
        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
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