/**
 * Ranks servers based on quality criteria.
 * @param {Array} servers - List of server objects.
 * @returns {Array} - Sorted list of servers with 'best' flag.
 */
export function rankServers(servers) {
    if (!servers || servers.length === 0) return [];

    // Calculate score for each server
    const scoredServers = servers.map(server => {
        let score = 0;

        // 1. Online Status (Critical)
        if (!server.alive) return { ...server, score: -1 };
        score += 1000;

        // 2. Latency (Lower is better)
        // Cap latency penalty at 500ms
        const latencyScore = Math.max(0, 500 - (server.latency || 1000));
        score += latencyScore;

        // 3. Arabic Subtitles
        if (server.hasSubtitles) score += 200;

        // 4. Stream Format (.m3u8 preferred)
        if (server.contentType && server.contentType.includes('application/x-mpegURL')) {
            score += 100;
        } else if (server.url && server.url.endsWith('.m3u8')) {
            score += 100;
        }

        // 5. Backup Status (Prefer primary servers)
        if (!server.isBackup) score += 150;

        // 6. Source Preference
        if (server.source === 'vidsrc') score += 50;

        return { ...server, score };
    });

    // Filter out dead servers (score -1)
    const aliveServers = scoredServers.filter(s => s.score >= 0);

    // Sort by score descending
    aliveServers.sort((a, b) => b.score - a.score);

    // Mark best server
    if (aliveServers.length > 0) {
        aliveServers[0].best = true;
    }

    return aliveServers;
}
