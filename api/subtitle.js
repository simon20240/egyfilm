
import axios from 'axios';
import srt2vtt from 'srt-to-vtt';
import zlib from 'zlib';
import { Readable } from 'stream';

export default async (req, res) => {
    const { imdbId } = req.query;
    const apiKey = process.env.OPENSUBTITLES_API_KEY;

    if (!imdbId) {
        res.status(400).send('WEBVTT\n\nNOTE IMDb ID is required.');
        return;
    }

    if (!apiKey) {
        res.status(500).send('WEBVTT\n\nNOTE OpenSubtitles API key is not configured.');
        return;
    }

    try {
        // 1. Search for subtitles
        const searchResponse = await axios.get(`https://api.opensubtitles.com/api/v1/subtitles`, {
            params: {
                imdb_id: imdbId,
                languages: 'ar'
            },
            headers: {
                'Api-Key': apiKey,
                'Accept': 'application/json'
            }
        });

        const searchData = searchResponse.data;
        if (!searchData.data || searchData.data.length === 0) {
            res.status(404).send('WEBVTT\n\nNOTE No Arabic subtitle found for this title.');
            return;
        }

        // 2. Find the best subtitle file (e.g., most downloaded)
        const bestSubtitle = searchData.data.reduce((prev, current) => 
            (prev.attributes.downloads > current.attributes.downloads) ? prev : current
        );
        const fileId = bestSubtitle.attributes.files[0].file_id;

        // 3. Get the download link
        const downloadResponse = await axios.post(`https://api.opensubtitles.com/api/v1/download`, {
            file_id: fileId
        }, {
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const downloadLink = downloadResponse.data.link;
        if (!downloadLink) {
            res.status(404).send('WEBVTT\n\nNOTE Could not retrieve download link.');
            return;
        }

        // 4. Download the compressed SRT file
        const fileResponse = await axios.get(downloadLink, { responseType: 'arraybuffer' });
        const compressedData = fileResponse.data;

        // 5. Decompress the file
        const srtContent = await new Promise((resolve, reject) => {
            zlib.gunzip(compressedData, (err, result) => {
                if (err) return reject(err);
                resolve(result.toString('utf-8'));
            });
        });

        // 6. Convert SRT to VTT and send the response
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache for 1 day
        
        const srtStream = new Readable();
        srtStream.push(srtContent);
        srtStream.push(null); // End of stream

        srtStream.pipe(srt2vtt()).pipe(res);

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error('Subtitle service error:', errorMessage);
        res.status(500).send(`WEBVTT\n\nNOTE Subtitle service error: ${errorMessage}`);
    }
};
