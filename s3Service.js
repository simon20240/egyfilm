const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// --- AWS S3 Configuration ---
// Make sure to set these in your .env file and configure your AWS credentials
// (e.g., via ~/.aws/credentials or environment variables)
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_REGION = process.env.AWS_S3_REGION;
const CLOUDFRONT_URL = process.env.AWS_CLOUDFRONT_URL; // e.g., https://d12345abcdef.cloudfront.net

if (!S3_BUCKET_NAME || !S3_REGION || !CLOUDFRONT_URL) {
    console.warn('AWS S3/CloudFront environment variables are not fully configured. S3 uploads will fail.');
}

const s3 = new AWS.S3({ region: S3_REGION });

/**
 * Uploads a directory of HLS files (m3u8, ts) to an S3 bucket.
 * @param {string} localDirectoryPath - The local path to the directory containing HLS files.
 * @param {string} s3DirectoryName - The name of the directory to create in S3 (e.g., the TMDb ID).
 * @returns {Promise<string|null>} The CloudFront URL to the main m3u8 playlist, or null on failure.
 */
async function uploadHlsToS3(localDirectoryPath, s3DirectoryName) {
    try {
        console.log(`[S3] Starting upload of HLS files from ${localDirectoryPath} to S3 bucket ${S3_BUCKET_NAME}/${s3DirectoryName}`);
        const files = await fs.promises.readdir(localDirectoryPath);

        for (const file of files) {
            const localFilePath = path.join(localDirectoryPath, file);
            const s3Key = `${s3DirectoryName}/${file}`;

            console.log(`[S3] Uploading ${file} to s3://${S3_BUCKET_NAME}/${s3Key}`);

            await s3.upload({
                Bucket: S3_BUCKET_NAME,
                Key: s3Key,
                Body: fs.createReadStream(localFilePath),
                ACL: 'public-read', // Make files publicly accessible
                ContentType: file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
            }).promise();
        }

        const manifestUrl = `${CLOUDFRONT_URL}/${s3DirectoryName}/master.m3u8`;
        console.log(`[S3] Upload complete. HLS manifest URL: ${manifestUrl}`);
        return manifestUrl;

    } catch (error) {
        console.error('[S3] Error uploading HLS directory to S3:', error);
        return null;
    }
}

module.exports = { uploadHlsToS3 };