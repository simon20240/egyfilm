require('dotenv').config();
const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs').promises;
const { uploadHlsToS3 } = require('./src/services/s3Service');
const { downloadVideoLocally, transcodeToHls } = require('./src/utils/videoProcessor');
const { findMediaDetails, fetchFromTMDb, saveVideoData } = require('./src/utils/mediaUtils'); // We will create this file next

const REDIS_CONNECTION = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
};

const QUEUE_NAME = 'video-processing';

/**
 * This is the core processing logic for a single video URL.
 * It's moved from upload.js to be run by the worker.
 * @param {string} pageUrl The URL of the single movie/series page.
 */
async function processSinglePage(pageUrl) {
    let localVideoPath = null;
    let hlsOutputPath = null;
    try {
        console.log(`[WORKER] Processing job for: ${pageUrl}`);
        // 1. Scrape page to get TMDb ID and media type
        const mediaDetails = await findMediaDetails(pageUrl);
        if (!mediaDetails) {
            throw new Error(`Failed to find media details for ${pageUrl}`);
        }
        const { tmdbId, mediaType, videoUrl } = mediaDetails;

        // 2. Download the video file
        localVideoPath = await downloadVideoLocally(videoUrl);
        if (!localVideoPath) {
            throw new Error(`Failed to download video file from ${videoUrl}`);
        }

        // 3. Transcode the video to HLS
        hlsOutputPath = path.join(__dirname, 'temp', `hls-${tmdbId}-${Date.now()}`);
        await fs.mkdir(hlsOutputPath, { recursive: true });
        await transcodeToHls(localVideoPath, hlsOutputPath);

        // 4. Upload HLS files to S3
        const s3DirectoryName = `${mediaType}/${tmdbId}`;
        const manifestUrl = await uploadHlsToS3(hlsOutputPath, s3DirectoryName);
        if (!manifestUrl) {
            throw new Error('Failed to upload HLS files to S3.');
        }

        // 5. Fetch full metadata from TMDb
        const tmdbData = await fetchFromTMDb(mediaType, tmdbId);
        if (!tmdbData) {
            throw new Error(`Could not find item with TMDb ID ${tmdbId}.`);
        }

        // 6. Combine and save data
        const finalData = {
            ...tmdbData,
            hls_manifest_url: manifestUrl,
            media_type: mediaType === 'movies' ? 'movie' : 'tv'
        };
        await saveVideoData(mediaType, finalData);

        return { success: true, message: 'Processing complete!', data: finalData };
    } catch (error) {
        console.error(`[WORKER] Error processing ${pageUrl}:`, error.message);
        throw error; // Re-throw to let BullMQ know the job failed
    } finally {
        // 7. Clean up temporary files
        if (localVideoPath) {
            await fs.unlink(localVideoPath).catch(err => console.error(`Failed to delete temp file ${localVideoPath}:`, err));
        }
        if (hlsOutputPath) {
            await fs.rm(hlsOutputPath, { recursive: true, force: true }).catch(err => console.error(`Failed to delete temp HLS directory ${hlsOutputPath}:`, err));
        }
    }
}

// --- Initialize the Worker ---
const worker = new Worker(QUEUE_NAME, async (job) => {
    const { pageUrl } = job.data;
    console.log(`[WORKER] Picked up job #${job.id} for URL: ${pageUrl}`);
    await processSinglePage(pageUrl);
}, {
    connection: REDIS_CONNECTION,
    concurrency: 1, // Process one video at a time to not overload the CPU
});

console.log('Video processing worker started...');

worker.on('completed', (job) => {
    console.log(`[WORKER] Job #${job.id} has completed for URL: ${job.data.pageUrl}`);
});

worker.on('failed', (job, err) => {
    console.error(`[WORKER] Job #${job.id} has failed for URL: ${job.data.pageUrl} with error: ${err.message}`);
});