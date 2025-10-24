import 'dotenv/config';
import fetch from 'node-fetch';

export async function getSuperEmbedServers(tmdb_id, imdb_id, isSeries = false, season, episode) {
    const servers = {
        name: "SuperEmbed",
        sub_servers: []
    };

    const generateUrl = (base, video_id, is_tmdb, is_vip) => {
        let url = `${base}?video_id=${video_id}`;
        if (is_tmdb) url += '&tmdb=1';
        if (isSeries && season && episode) {
            url += `&s=${season}&e=${episode}`;
        }
        return url;
    };

    const checkVip = async (video_id, is_tmdb) => {
        let url = `https://multiembed.mov/directstream.php?video_id=${video_id}&check=1`;
        if (is_tmdb) url += '&tmdb=1';
        try {
            const response = await fetch(url);
            const text = await response.text();
            return text.trim() === '1';
        } catch (error) {
            console.error(`Error checking for VIP server for ID ${video_id}:`, error);
            return false;
        }
    };

    // VIP servers have priority
    if (imdb_id && await checkVip(imdb_id, false)) {
        servers.sub_servers.push({
            name: "SuperEmbed VIP",
            url: generateUrl('https://multiembed.mov/directstream.php', imdb_id, false, true)
        });
    } else if (tmdb_id && await checkVip(tmdb_id, true)) {
        servers.sub_servers.push({
            name: "SuperEmbed VIP",
            url: generateUrl('https://multiembed.mov/directstream.php', tmdb_id, true, true)
        });
    }

    // Normal servers
    if (imdb_id) {
        servers.sub_servers.push({
            name: "SuperEmbed IMDb",
            url: generateUrl('https://multiembed.mov/', imdb_id, false, false)
        });
    }
    if (tmdb_id) {
        servers.sub_servers.push({
            name: "SuperEmbed TMDB",
            url: generateUrl('https://multiembed.mov/', tmdb_id, true, false)
        });
    }

    return servers;
}
