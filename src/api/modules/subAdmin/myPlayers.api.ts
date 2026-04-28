

// get players - SubAdmin/my-players

import client from "../../client";


export const getSubAdminPlayers = async () => {
    try {
        const response = await client.get(`SubAdmin/my-players`);
        return response.data;
    } catch (error) {
        console.error("Error fetching players:", error);
        throw error;
    }
}


// subadmincourses - SubAdmin/my-courses

export const getSubAdminCourses = async () => {
    try {
        const response = await client.get(`SubAdmin/my-courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
}


// Invite player - SubAdmin/invite-player

export const invitePlayer = async (data: any) => {
    try {
        const response = await client.post(`SubAdmin/invite-player`, data);
        return response.data;
    } catch (error) {
        console.error("Error inviting player:", error);
        throw error;
    }
}


// get certificate by userId - User/2/certificate
export const getPlayerCertificateById = async (userId: number) => {
    try {
        const response = await client.get(`User/${userId}/certificate`);
        return response.data;
    } catch (error) {
        console.error("Fetching certificate by userId Error:", error);
        throw error;
    }
};

// block player - SubAdmin/block-player/43
export const blockPlayer = async (id: number) => {
    try {
        const response = await client.put(`SubAdmin/block-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error blocking player:", error);
        throw error;
    }
}

export const unblockPlayer = async (id: number) => {
    try {
        const response = await client.put(`SubAdmin/unblock-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error unblocking player:", error);
        throw error;
    }
}


// delete player - SubAdmin/remove-player/46

export const deleteSubAdminPlayer = async (id: number) => {
    try {
        const response = await client.delete(`SubAdmin/remove-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting player:", error);
        throw error;
    }
}


// get player game history - SubAdmin/my-players/4/history

export const getPlayerGameHistory = async (id: number) => {
    try {
        const response = await client.get(`SubAdmin/my-players/${id}/history`);
        // console.log("response", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching player game history:", error);
        throw error;
    }
}


// get player scorecard - scorecard/details/2260

export const getPlayerScorecard = async (id: number) => {
    try {
        const response = await client.get(`scorecard/details/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching player scorecard:", error);
        throw error;
    }
}