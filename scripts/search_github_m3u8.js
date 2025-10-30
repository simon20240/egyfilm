#!/usr/bin/env node
/*
Search GitHub code for .m3u8 references, fetch file contents, extract video URLs,
and save results to data/raw_github_matches.json

Usage:
  GITHUB_TOKEN=xxxx node scripts/search_github_m3u8.js --query=".m3u8" --maxPages=3

Notes:
  - Prefer running locally and providing a token via the GITHUB_TOKEN env var or --token.
  - The script uses the GitHub Code Search API and respects basic rate limits.
*/

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_FILE = path.resolve(__dirname, '..', 'data', 'raw_github_matches.json');

function argvFlag(name, def) {
  const prefix = `--${name}=`;
  for (const a of process.argv.slice(2)) if (a.startsWith(prefix)) return a.slice(prefix.length);
  return def;
}

const token = process.env.GITHUB_TOKEN || argvFlag('token');
const rawQuery = argvFlag('query', '.m3u8');
const maxPages = parseInt(argvFlag('maxPages', '3'), 10) || 3;
const perPage = 100; // GitHub max per page for search

if (!token) {
  console.error('Missing GitHub token. Set GITHUB_TOKEN env var or pass --token=TOKEN');
  process.exitCode = 1;
  // still create an example output file if folder missing
}

function ghRequest(url, method = 'GET') {
  const headers = {
    'User-Agent': 'egyfilm-search-script',
    Accept: 'application/vnd.github.v3+json'
  };
  if (token) headers.Authorization = `token ${token}`;

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (err) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFileContentApi(itemUrl) {
  // itemUrl is the API URL to the file content returned by code search result
  try {
    const res = await ghRequest(itemUrl);
    if (res.status === 200 && res.body && res.body.content) {
      const content = Buffer.from(res.body.content, res.body.encoding || 'base64').toString('utf8');
      return content;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function extractUrls(text) {
  if (!text) return [];
  // capture .m3u8 URLs and surrounding query strings
  const re = /https?:\/\/[^\s'"<>]+?\.m3u8[^\s'"<>]*/gi;
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null) matches.push(m[0]);
  // dedupe
  return Array.from(new Set(matches));
}

async function main() {
  const results = [];

  // Build a safe query that searches for m3u8 in files
  const q = encodeURIComponent(`${rawQuery} in:file`);
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://api.github.com/search/code?q=${q}&per_page=${perPage}&page=${page}`;
    console.error(`Searching GitHub (page ${page})...`);
    const res = await ghRequest(url);
    if (res.status !== 200) {
      console.error('Search request failed:', res.status, res.body && res.body.message);
      break;
    }

    const items = (res.body && res.body.items) || [];
    console.error(`  results: ${items.length}`);
    for (const it of items) {
      const fileApiUrl = it.url; // API URL to the file content
      const repo = it.repository && it.repository.full_name;
      const pathStr = it.path;
      const html_url = it.html_url;

      const content = await fetchFileContentApi(fileApiUrl);
      const matches = extractUrls(content || it.text || '');

      if (matches.length > 0) {
        results.push({ repo, path: pathStr, html_url, matches });
        console.error(`   [${repo}/${pathStr}] -> ${matches.length} urls`);
      }

      // small delay to avoid hitting secondary rate limits
      await sleep(200);
    }

    // If we got fewer than perPage results, stop early
    if (!res.body || (res.body.items && res.body.items.length < perPage)) break;
    // Respect rate limits: small delay between pages
    await sleep(1000);
  }

  // Ensure data directory exists
  const outDir = path.dirname(OUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify({ generated_at: new Date().toISOString(), query: rawQuery, results }, null, 2));
  console.error(`Saved ${results.length} matched files to ${OUT_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err && err.stack || err);
  process.exit(1);
});
