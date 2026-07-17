import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'scraper.log');

function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(logMessage.trim());
    
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}

export default {
    info: (msg) => log(msg, 'INFO'),
    error: (msg) => log(msg, 'ERROR'),
    warn: (msg) => log(msg, 'WARN')
};
