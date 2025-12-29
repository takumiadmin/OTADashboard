import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'; // Removed GetObjectCommand since presigned URL is no longer needed
import fs from 'fs';

const BUCKET_NAME = "tmcdevs3bucket";
const REGION = "ap-south-1";
const CHUNK_SIZE = 32768; // 32KB, matching the Streamlit default chunk size

// Initialize the S3 client
const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: "put the access key id here",
        secretAccessKey: "put the secret access key here"
    }
});

/**
 * Uploads a file to an S3 bucket by chunking it and returns the public URL of the metadata file.
 * @param {Buffer} fileBuffer - The file buffer to be uploaded.
 * @param {string} fileName - The original file name.
 * @returns {Promise<string>} - The public URL of the metadata file.
 */
export const save_file = async (fileBuffer, fileName) => {
    try {
        // Replace rsplit with JavaScript equivalent
        const [filePrefix, fileExtension] = fileName.split('.').length > 1 
            ? fileName.split('.').slice(-2) 
            : [fileName, ''];
        let chunkCount = 0;
        let firstChunkFileName = null;
        const fileSize = fileBuffer.length;
        let lastChunkSize = 0;

        // Chunk and upload the file
        for (let i = 0; i < fileSize; i += CHUNK_SIZE) {
            const chunk = fileBuffer.slice(i, i + CHUNK_SIZE);
            chunkCount++;
            lastChunkSize = chunk.length;
            const chunkFileName = `${filePrefix}_part${chunkCount}.${fileExtension}`;

            if (chunkCount === 1) {
                firstChunkFileName = chunkFileName;
            }

            console.log(`Uploading chunk ${chunkCount}: ${chunkFileName}`);
            await s3.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: chunkFileName,
                Body: chunk,
                ContentType: 'application/octet-stream'
            }));
        }

        // Prepare metadata
        const metadata = {
            first_link: `https://${BUCKET_NAME}.s3.amazonaws.com/${firstChunkFileName}`,
            chunk_size: CHUNK_SIZE,
            chunk_count: chunkCount,
            file_size: fileSize,
            last_chunk_size: lastChunkSize
        };
        const metadataFileName = `${filePrefix}.json`;
        const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf-8');

        console.log(`Uploading metadata file: ${metadataFileName}`);
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: metadataFileName,
            Body: metadataBuffer,
            ContentType: 'application/json',
            ContentDisposition: 'attachment'
        }));

        // Return the public URL for the metadata file
        const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${metadataFileName}`;
        console.log(`Generated public URL for metadata: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error("❌ Error uploading file to S3:", error);
        throw new Error("Failed to upload file to S3");
    }
};

// Keeping getPresignedUrl for internal use if needed (though not used now)
const getPresignedUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
};