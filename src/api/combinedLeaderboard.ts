import https from "./https";


// get combined leaderboard - Tournament/12/leaderboard
export const getCombinedLeaderboard = async (tournamentId: number) => {
    try {
        const response = await https.get(`Tournament/${tournamentId}/leaderboard`);
        return response.data;
    } catch (error) {
        console.error("Fetching combined leaderboard Error:", error);
        throw error;
    }
}