
require('dotenv').config();
const { remoteUpload, checkUploadStatus, getFileInfo } = require('./services/doodstreamService');
const { postToWebsite } = require('./services/siteApiService');
const { readJsonFile, saveToLocalFile } = require('./utils/fileHandler');

// Function to delay execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function to run the bot
async function main() {
  // Read content from content.json
  const content = await readJsonFile('data/content.json');
  if (!content) {
    console.error('Could not read content.json, or it is empty. Exiting.');
    return;
  }

  // Process each category
  for (const category in content) {
    if (!Object.prototype.hasOwnProperty.call(content, category)) continue;

    console.log(`\n--- Processing category: ${category.toUpperCase()} ---`);
    const items = content[category];

    // Process each item in the category
    for (const item of items) {
      console.log(`\nProcessing item: ${item.title}`);

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
          
          const firstResult = statusResult && statusResult[0];
          if (firstResult && firstResult.uploaded) {
              const progress = parseInt(firstResult.uploaded, 10);
              console.log(`Upload progress for ${fileCode}: ${progress}%`);
              if (progress === 100) {
                  uploadResult = statusResult;
                  break; // Exit loop on completion
              }
          } else if (statusResult) {
              console.log(`Status for ${fileCode}: ${firstResult.status}`);
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
