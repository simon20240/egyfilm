const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const API_KEY = process.env.DOODSTREAM_API_KEY;
const API_URL = 'https://doodapi.com/api';

if (!API_KEY) {
    throw new Error('Doodstream API key is not defined. Please check your .env file.');
}

/**
 * Initiates a remote upload on Doodstream.
 * @param {string} videoUrl The URL of the video to upload.
 * @returns {Promise<string|null>} The file code of the upload job or null on failure.
 */
async function remoteUpload(videoUrl) {
    const endpoint = '/upload/remote';
    const url = `${API_URL}${endpoint}?key=${API_KEY}&url=${encodeURIComponent(videoUrl)}`;

    try {
        console.log(`Initiating Doodstream remote upload for: ${videoUrl}`);
        const response = await axios.get(url);

        if (response.data && response.data.status === 200) {
            console.log('Doodstream upload initiated successfully.');
            return response.data.result.filecode;
        } else {
            console.error('Doodstream API error (remoteUpload):', response.data.msg || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error calling Doodstream remote upload API:', error.message);
        return null;
    }
}

/**
 * Retrieves file information, including the embed URL.
 * @param {string} fileCode The file code from the upload job.
 * @returns {Promise<object|null>} The file info object or null on failure.
 */
async function getFileInfo(fileCode) {
    const endpoint = '/file/info';
    const url = `${API_URL}${endpoint}?key=${API_KEY}&file_code=${fileCode}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.status === 200) {
            return response.data.result[0];
        } else {
            console.error('Doodstream API error (getFileInfo):', response.data.msg || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error calling Doodstream file info API:', error.message);
        return null;
    }
}

/**
 * Checks the status of a remote upload job.
 * @param {string} fileCode The file code of the upload job.
 * @returns {Promise<object|null>} The status result object or null on failure.
 */
async function checkUploadStatus(fileCode) {
    const endpoint = '/upload/status';
    const url = `${API_URL}${endpoint}?key=${API_KEY}&file_code=${fileCode}`;

    try {
        const response = await axios.get(url);

        if (response.data && response.data.status === 200) {
            // The API returns an array of statuses
            return response.data.result;
        } else {
            console.error('Doodstream API error (checkUploadStatus):', response.data.msg || 'Unknown error');
            return null;
        }
    } catch (error) {
        console.error('Error calling Doodstream upload status API:', error.message);
        return null;
    }
}

/**
 * Uploads a local file to Doodstream.
 * @param {string} filePath The local path to the video file.
 * @returns {Promise<string|null>} The file code of the uploaded file or null on failure.
 */
async function localUpload(filePath) {
    try {
        // 1. Get an upload server URL from Doodstream API
        console.log('Requesting Doodstream upload server...');
        const uploadServerResponse = await axios.get(`${API_URL}/upload/server?key=${API_KEY}`);
        if (uploadServerResponse.data.status !== 200) {
            console.error('Could not get Doodstream upload server:', uploadServerResponse.data.msg);
            return null;
        }
        const uploadUrl = uploadServerResponse.data.result;
        console.log(`Using upload server: ${uploadUrl}`);

        // 2. Create the form and append the file stream
        const form = new FormData();
        form.append('api_key', API_KEY);
        form.append('file', fs.createReadStream(filePath));

        // 3. Post the form to the upload URL
        console.log(`Starting local file upload for: ${filePath}`);
        const uploadResponse = await axios.post(uploadUrl, form, {
            headers: form.getHeaders()
        });

        if (uploadResponse.data.status === 200) {
            console.log('Local file upload successful.');
            return uploadResponse.data.result[0].filecode; // Return the file code
        }
        console.error('Doodstream API error (localUpload):', uploadResponse.data.msg);
        return null;
    } catch (error) {
        console.error('Error during Doodstream local upload:', error.message);
        return null;
    }
}

module.exports = { remoteUpload, getFileInfo, checkUploadStatus, localUpload };