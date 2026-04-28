import client from "../client";


// get combined leaderboard - Tournament/12/leaderboard
export const getCombinedLeaderboard = async (tournamentId: number) => {
    try {
        const response = await client.get(`Tournament/${tournamentId}/leaderboard`);
        return response.data;
    } catch (error) {
        console.error("Fetching combined leaderboard Error:", error);
        throw error;
    }
}