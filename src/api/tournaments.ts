import https from "./https";

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