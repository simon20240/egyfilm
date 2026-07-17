const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'scraper.log');

module.exports = (req, res) => {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const logs = fs.readFileSync(LOG_FILE, 'utf-8');
            // Return last 100 lines
            const lines = logs.split('\n').slice(-100).join('\n');
            res.send(lines);
        } else {
            res.send('No logs found.');
        }
    } catch (error) {
        res.status(500).send('Error reading logs');
    }
};
