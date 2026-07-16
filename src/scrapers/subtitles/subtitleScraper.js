import axios from 'axios';
import srt2vtt from 'srt-to-vtt';
import zlib from 'zlib';
import { Readable } from 'stream';
import logger from '../../utils/logger.js';

// TODO: Move API key to config/env
const OPENSUBTITLES_API_KEY = process.env.OPENSUBTITLES_API_KEY;

export async function fetchArabicSubtitle(imdbId) {
    if (!OPENSUBTITLES_API_KEY) {
        logger.warn('OpenSubtitles API key missing. Skipping subtitle fetch.');
        return null;
    }

    try {
        // 1. Search for subtitles
        const searchResponse = await axios.get(`https://api.opensubtitles.com/api/v1/subtitles`, {
            params: {
                imdb_id: imdbId,
                languages: 'ar'
            },
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'Accept': 'application/json'
            }
        });

        const searchData = searchResponse.data;
        if (!searchData.data || searchData.data.length === 0) {
            return null;
        }

        // 2. Find the best subtitle file (most downloaded)
        const bestSubtitle = searchData.data.reduce((prev, current) => 
            (prev.attributes.downloads > current.attributes.downloads) ? prev : current
        );
        const fileId = bestSubtitle.attributes.files[0].file_id;

        // 3. Get the download link
        const downloadResponse = await axios.post(`https://api.opensubtitles.com/api/v1/download`, {
            file_id: fileId
        }, {
            headers: {
                'Api-Key': OPENSUBTITLES_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const downloadLink = downloadResponse.data.link;
        if (!downloadLink) return null;

        // 4. Download and convert
        const fileResponse = await axios.get(downloadLink, { responseType: 'arraybuffer' });
        const compressedData = fileResponse.data;

        const srtContent = await new Promise((resolve, reject) => {
            zlib.gunzip(compressedData, (err, result) => {
                if (err) return reject(err);
                resolve(result.toString('utf-8'));
            });
        });

        // Convert to VTT (in memory for now, or save to file?)
        // For this module, let's return the VTT content string.
        // Note: srt2vtt is a stream transformer. We need to buffer it.
        
        const vttBuffer = await new Promise((resolve, reject) => {
            const srtStream = new Readable();
            srtStream.push(srtContent);
            srtStream.push(null);
            
            const chunks = [];
            const converter = srt2vtt();
            
            srtStream.pipe(converter);
            
            converter.on('data', chunk => chunks.push(chunk));
            converter.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
            converter.on('error', reject);
        });

        return {
            lang: 'ar',
            type: 'vtt',
            content: vttBuffer,
            source: 'opensubtitles'
        };

    } catch (error) {
        logger.error(`Subtitle fetch error for ${imdbId}: ${error.message}`);
        return null;
    }
}
