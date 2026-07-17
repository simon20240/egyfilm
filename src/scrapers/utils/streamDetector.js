import fetch from 'node-fetch';
import logger from '../../utils/logger.js';

/**
 * Checks if a stream URL is accessible and returns its metadata.
 * @param {string} url - The stream URL to check.
 * @returns {Promise<object>} - { alive: boolean, latency: number, contentType: string, size: number }
 */
export async function checkStreamHealth(url) {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal
        });
        clearTimeout(timeout);

        const latency = Date.now() - start;
        
        if (response.ok) {
            return {
                alive: true,
                latency,
                contentType: response.headers.get('content-type'),
                size: parseInt(response.headers.get('content-length') || 0, 10)
            };
        } else {
            // Try GET if HEAD fails (some servers block HEAD)
             const controllerGet = new AbortController();
             const timeoutGet = setTimeout(() => controllerGet.abort(), 5000);
             
             const responseGet = await fetch(url, {
                method: 'GET',
                headers: { Range: 'bytes=0-100' }, // Request only first 100 bytes
                signal: controllerGet.signal
            });
            clearTimeout(timeoutGet);
            
            const latencyGet = Date.now() - start;

            if (responseGet.ok || responseGet.status === 206) {
                 return {
                    alive: true,
                    latency: latencyGet,
                    contentType: responseGet.headers.get('content-type'),
                    size: parseInt(responseGet.headers.get('content-length') || 0, 10)
                };
            }
        }
    } catch (error) {
        logger.warn(`Stream check failed for ${url}: ${error.message}`);
    }

    return { alive: false, latency: -1, contentType: null, size: 0 };
}
