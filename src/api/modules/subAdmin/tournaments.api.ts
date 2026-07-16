import client from "../../client";

// create tournament - post - Tournament
export const createTournament = async (payload: any) => {
    try {
        const response = await client.post(`Tournament`, payload);
        return response.data;
    } catch (error) {
        console.error("Error creating tournament:", error);
        throw error;
    }
}


// update tournament - put - Tournament/29
export const updateTournament = async (tournamentId: number, payload: any) => {
    try {
        const response = await client.put(`Tournament/${tournamentId}`, payload);
        return response.data;
    } catch (error) {
        console.error("Error updating tournament:", error);
        throw error;
    }
}

// delete tournament - delete - Tournament/29
export const deleteTournament = async (tournamentId: number) => {
    try {
        const response = await client.delete(`Tournament/${tournamentId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting tournament:", error);
        throw error;
    }
}


// get sub admin tournaments - Tournament
export const getSubAdminTournaments = async () => {
    try {
        const response = await client.get(`Tournament`);
        return response.data;
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        throw error;
    }
}


// get subadmin courses - SubAdmin/my-courses - my players page

export const getSubAdminCourses = async () => {
    try {
        const response = await client.get(`SubAdmin/my-courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
}

// get coursedetails for teeboxes - course/10
export const getCourseDetails = async (courseId: number) => {
    try {
        const response = await client.get(`course/${courseId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching course details:", error);
        throw error;
    }
}


// get players for roaster page by tournamentId - Tournament/28/players

export const getTournamentPlayers = async (tournamentId: number) => {
    try {
        const response = await client.get(`Tournament/${tournamentId}/players`);
        return response.data;
    } catch (error) {
        console.error("Error fetching tournament players:", error);
        throw error;
    }
}

// get roaster players - SubAdmin/my-players


export const getRoasterPlayers = async () => {
    try {
        const response = await client.get(`SubAdmin/my-players`);
        return response.data;
    } catch (error) {
        console.error("Error fetching roaster players:", error);
        throw error;
    }
}


// add to roaster payload : tournamentId: 29 userId: 43
// Tournament/join

export const addToRoaster = async (tournamentId: number, userId: number) => {
    try {
        const response = await client.post(`Tournament/join`, { tournamentId, userId });
        return response.data;
    } catch (error) {
        console.error("Error adding to roaster:", error);
        throw error;
    }
}

// remove from roaster payload : tournamentId: 29 userId: 43
// Tournament/29/players/43

export const removeFromRoaster = async (tournamentId: number, userId: number) => {
    try {
        const response = await client.delete(`Tournament/${tournamentId}/players/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error removing from roaster:", error);
        throw error;
    }
}

export const getGroups = async (tournamentId: number) => {
    try {
        const response = await client.get(`Tournament/${tournamentId}/groups`);
        return response.data;
    } catch (error) {
        console.error("Fetching tournament groups Error:", error);
        throw error;
    }
};

export const saveGroups = async (tournamentId: number, groups: any[]) => {
    try {
        const response = await client.post(`Tournament/${tournamentId}/groups`, groups);
        return response.data;
    } catch (error) {
        console.error("Saving tournament groups Error:", error);
        throw error;
    }
};