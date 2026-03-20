import https from "../https";

export const getTournaments = async () => {
    try {
        const response = await https.get(`Tournament`);
        // console.log("Fetching Tournament list:", response.data);
        return response.data;

    } catch (error) {
        console.error("Fetching tournament Error:", error);
        throw error;
    }
};


// Create Tournament Tournament

export const createTournament = async (tournamentData: any) => {
    try {
        const response = await https.post(`Tournament`, tournamentData);
        console.log("Created Tournament:", response.data);
        return response.data;
    } catch (error) {
        console.error("Create Tournament Error:", error);
        throw error;
    }
};

// Update Tournament Tournament/16

export const updateTournament = async (tournamentId: number, tournamentData: any) => {
    try {
        const response = await https.put(`Tournament/${tournamentId}`, tournamentData);
        console.log("Updated Tournament:", response.data);
        return response.data;
    } catch (error) {
        console.error("Update Tournament Error:", error);
        throw error;
    }
};

// delete Tournament Tournament/15

export const deleteTournament = async (tournamentId: number) => {
    try {
        const response = await https.delete(`Tournament/${tournamentId}`);
        console.log("Deleted Tournament:", response.data);
        return response.data;
    } catch (error) {
        console.error("Delete Tournament Error:", error);
        throw error;
    }
};

// get all players User/list

export const getAllPlayers = async () => {
    try {
        const response = await https.get(`User/list`);
        // console.log("Fetching all players list:", response.data);
        return response.data;

    } catch (error) {
        console.error("Fetching all players Error:", error);
        throw error;
    }
};

// get players of tournament: Tournament/13/players

export const getTournamentPlayers = async (tournamentId: number) => {
    try {
        const response = await https.get(`Tournament/${tournamentId}/players`);
        // console.log("Fetching Tournament players list:", response.data);
        return response.data;

    } catch (error) {
        console.error("Fetching tournament players Error:", error);
        throw error;
    }
};

// add player to tournament: Tournament/13/players Tournament/join tournamentId: 13, userId: 27

export const addPlayerToTournament = async (tournamentId: number, userId: number) => {
    try {
        const response = await https.post(`Tournament/join`, { tournamentId, userId });
        console.log("Added Tournament players :", response.data, "tournamentId:", tournamentId, "userId:", userId);
        return response.data;

    } catch (error) {
        console.error("Added tournament players Error:", error);
        throw error;
    }
};

// Remove player from tournament: Tournament/13/players/27

export const removePlayerFromTournament = async (tournamentId: any, userId: any) => {
    try {
        const response = await https.delete(`Tournament/${tournamentId}/players/${userId}`);
        console.log("Removed Tournament players :", response.data, "tournamentId:", tournamentId, "userId:", userId);
        return response.data;
    } catch (error) {
        console.error("Removed tournament players Error:", error);
        throw error;
    }
};

// get tournament history: scorecard/tournament-history/14

export const getTournamentHistory = async (tournamentId: number) => {
    try {
        const response = await https.get(`scorecard/tournament-history/${tournamentId}`);
        // console.log("Fetching Tournament history list:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching tournament history Error:", error);
        throw error;
    }
};


// get scorecard of player: scorecard/details/1936

export const getScorecardDetails = async (scorecardId: number) => {
    try {
        const response = await https.get(`scorecard/details/${scorecardId}`);
        // console.log("Fetching scorecard details:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching scorecard details Error:", error);
        throw error;
    }
};


// get leaderboard of tournament: Tournament/14/leaderboard

export const getLeaderboard = async (tournamentId: number) => {
    try {
        const response = await https.get(`Tournament/${tournamentId}/leaderboard`);
        // console.log("Fetching leaderboard list:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching leaderboard Error:", error);
        throw error;
    }
};


// get teebox details : holes/teebox/23

export const getTeeboxDetails = async (holeId: number) => {
    try {
        const response = await https.get(`holes/teebox/${holeId}`);
        // console.log("Fetching teebox details:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching teebox details Error:", error);
        throw error;
    }
};
