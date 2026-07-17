
import dotenv from 'dotenv';
dotenv.config();

export const config = {
    tmdb: {
        apiKey: process.env.TMDB_API_KEY || 'c9c1cc68a0854d7ac67036ffd6768a53', // Fallback to key found in script.js
        accessToken: process.env.TMDB_ACCESS_TOKEN || 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjOWMxY2M2OGEwODU0ZDdhYzY3MDM2ZmZkNjc2OGE1MyIsIm5iZiI6MTc1OTk0MjkzMS4xMDksInN1YiI6IjY4ZTY5OTEzNWRiY2Q3Y2FmNzAxMDM3NSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Vl54E0QE7skBZdPm7GBPxzEDrWuw9UkMQYDHnNCePnM',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p/'
    },
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    paths: {
        content: 'data/content.json',
        servers: 'data/servers.json'
    }
};
