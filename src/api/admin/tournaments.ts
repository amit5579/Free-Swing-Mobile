import https from "../https";
import AsyncStorage from "@react-native-async-storage/async-storage";

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


// get all tournaments for user- Tournament/player/{userId}

export const getAllTournaments = async () => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await https.get(`/Tournament/player/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Fetching all tournaments Error:", error);
        throw error;
    }
}


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

// Create Tournament Tournament courseId: 10 creatorId: 2 description: "" endDate: "2026-03-26" maxPlayers: 16 name: "New hem test" scoringType: "double-peoria-net" startDate: "2026-03-25" teeBoxId: 26

export const createMiniTournament = async (courseId: number, description: string, endDate: string, maxPlayers: number, name: string, scoringType: string, startDate: string, teeBoxId: number) => {
    try {

        const creatorId = await AsyncStorage.getItem("userId");
        if (!creatorId) {
            throw new Error("creatorId not found in storage");
        }

        const response = await https.post(`Tournament`, { courseId, creatorId, description, endDate, maxPlayers, name, scoringType, startDate, teeBoxId });
        // console.log("Created Tournament:", response.data);
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

// Get tournament history by user id and tournament id - scorecard/history/2/14

export const getTournamentHistoryByUserId = async (tournamentId: number) => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await https.get(`scorecard/my-tournament-history/${tournamentId}/${userId}`);
        // console.log("Fetching tournament history list:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching tournament history Error:", error);
        throw error;
    }
};







// tournament-scorecard
// get handicap by user id and tournament id - scorecard/handicap/2/2

export const getHandicap = async (tournamentId: number) => {
    try {
        const userId = await AsyncStorage.getItem("userId");

        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await https.get(`scorecard/handicap/${userId}/${tournamentId}`);
        // console.log("Fetching handicap:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching handicap Error:", error);
        throw error;
    }
};


// get scorecard by id - scorecard/details/1

export const getScorecardById = async (scorecardId: number) => {
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


// get list of members : User/list

export const getMembersList = async () => {
    try {
        const response = await https.get(`User/list`);
        // console.log("Fetching members list:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching members list Error:", error);
        throw error;
    }
};


// Add users to the tournament : post Tournament/join payload : tournamentId: 3, userId: 7

export const addUsersToTournament = async (tournamentId: number) => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await https.post(`Tournament/join`, { tournamentId, userId });
        // console.log("Added users to tournament:", response.data);
        return response.data;
    } catch (error) {
        console.error("Added users to tournament Error:", error);
        throw error;
    }
};