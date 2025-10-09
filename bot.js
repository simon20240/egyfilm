
require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;

const DOOD_API_KEY = process.env.DOOD_API_KEY;
const RESULTS_FILE = process.env.RESULTS_FILE;
const SITE_API_URL = process.env.SITE_API_URL;
const SITE_API_KEY = process.env.SITE_API_KEY;

const doodApi = axios.create({
  baseURL: 'https://doodapi.co/api',
  timeout: 30000,
});

// Function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 1. Remote Upload
async function remoteUpload(videoUrl) {
  try {
    console.log(`Initiating upload for: ${videoUrl}`);
    const response = await doodApi.get('/upload/url', {
      params: {
        key: DOOD_API_KEY,
        url: videoUrl,
      },
    });

    if (response.data.status === 200) {
      console.log('Upload initiated successfully:', response.data.result);
      return response.data.result.filecode;
    } else {
      console.error('Failed to initiate upload:', response.data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error during remote upload initiation:', error.message);
    return null;
  }
}

// 2. Check Upload Status
async function checkUploadStatus(filecode) {
  try {
    console.log(`Checking status for filecode: ${filecode}`);
    const response = await doodApi.get('/urlupload/status', {
      params: {
        key: DOOD_API_KEY,
        file_code: filecode,
      },
    });

    if (response.data.status === 200) {
        return response.data.result;
    } else {
      console.error('Could not get upload status:', response.data.msg);
      return null;
    }
  } catch (error) {
    console.error('Error checking upload status:', error.message);
    return null;
  }
}


// 3. Get File Info
async function getFileInfo(fileCode) {
    try {
        console.log(`Fetching file info for: ${fileCode}`);
        const response = await doodApi.get('/file/info', {
            params: {
                key: DOOD_API_KEY,
                file_code: fileCode,
            },
        });

        if (response.data.status === 200) {
            console.log('File info retrieved successfully.');
            return response.data.result[0]; // API returns an array
        } else {
            console.error('Failed to get file info:', response.data.msg);
            return null;
        }
    } catch (error) {
        console.error('Error fetching file info:', error.message);
        return null;
    }
}


// 4. Save results to local JSON
async function saveToLocalFile(data) {
  try {
    let existingData;
    try {
      const fileContent = await fs.readFile(RESULTS_FILE, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        existingData = { movies: [], series: [], anime: [] };
      } else {
        console.error('Error reading or parsing RESULTS_FILE:', error.message);
        existingData = { movies: [], series: [], anime: [] };
      }
    }

    // Ensure existingData is an object with the correct structure
    if (!existingData.movies) existingData.movies = [];
    if (!existingData.series) existingData.series = [];
    if (!existingData.anime) existingData.anime = [];

    // Merge new data
    for (const category in data) {
      if (data.hasOwnProperty(category)) {
        if (!existingData[category]) {
          existingData[category] = [];
        }
        existingData[category].push(...data[category]);
      }
    }

    await fs.writeFile(RESULTS_FILE, JSON.stringify(existingData, null, 2));
    console.log(`Successfully saved data to ${RESULTS_FILE}`);
  } catch (error) {
    console.error('Error saving data to local file:', error.message);
  }
}

// 5. Post to website API
async function postToWebsite(data) {
  try {
    console.log(`Sending data to website API: ${SITE_API_URL}`);
    await axios.post(SITE_API_URL, data, {
      headers: {
        'Authorization': `Bearer ${SITE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Successfully sent data to website API.');
  } catch (error) {
    console.error('Error posting to website API:', error.response ? error.response.data : error.message);
  }
}

// Main function to run the bot
async function main() {
  // Read content from content.json
  let content;
  try {
    const contentData = await fs.readFile('content.json', 'utf-8');
    content = JSON.parse(contentData);
  } catch (error) {
    console.error('Error reading content.json:', error.message);
    return;
  }

  // Process each category
  for (const category in content) {
    console.log(`
Processing category: ${category}`);
    const items = content[category];

    // Process each item in the category
    for (const item of items) {
      console.log(`
Processing item: ${item.title}`);

      // 1. Start the upload
      const fileCode = await remoteUpload(item.url);
      if (!fileCode) {
        console.log(`Skipping ${item.title} due to upload initiation failure.`);
        continue;
      }

      // 2. Poll for status
      let uploadResult = null;
      let retries = 10; // Poll 10 times
      let waitTime = 30000; // Wait 30 seconds between polls

      for (let i = 0; i < retries; i++) {
          await sleep(waitTime);
          console.log(`Polling attempt ${i + 1}/${retries} for ${fileCode}`);
          const statusResult = await checkUploadStatus(fileCode);

          if (statusResult && statusResult[0] && statusResult[0].uploaded) {
              const progress = parseInt(statusResult[0].uploaded, 10);
              console.log(`Upload progress for ${fileCode}: ${progress}%`);
              if (progress === 100) {
                  uploadResult = statusResult;
                  break; // Exit loop on completion
              }
          } else {
              console.log(`Waiting for upload to complete...`);
          }
      }

      if (!uploadResult) {
        console.log(`Upload did not complete for ${item.title} after multiple checks.`);
        continue;
      }

      // 3. Get file info to get the embed URL
      const fileInfo = await getFileInfo(fileCode);
      if (!fileInfo || !fileInfo.embed_url) {
          console.log(`Could not retrieve embed URL for ${item.title}.`);
          continue;
      }

      // 4. Prepare data for saving
      const resultData = {
        title: item.title,
        image: item.image, // Include image url
        doodstream_file_code: fileCode,
        embed_url: fileInfo.embed_url,
        uploaded_at: new Date().toISOString(),
      };

      // 5. Save to local file and post to website
      await saveToLocalFile({ [category]: [resultData] });
      await postToWebsite({ category, ...resultData });

      console.log(`Successfully processed and saved ${item.title}`);
    }
  }
}

main();
