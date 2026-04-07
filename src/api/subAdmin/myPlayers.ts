

// get players - SubAdmin/my-players

import https from "../https";


export const getSubAdminPlayers = async () => {
    try {
        const response = await https.get(`SubAdmin/my-players`);
        return response.data;
    } catch (error) {
        console.error("Error fetching players:", error);
        throw error;
    }
}


// subadmincourses - SubAdmin/my-courses

export const getSubAdminCourses = async () => {
    try {
        const response = await https.get(`SubAdmin/my-courses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching courses:", error);
        throw error;
    }
}


// Invite player - SubAdmin/invite-player

export const invitePlayer = async (data: any) => {
    try {
        const response = await https.post(`SubAdmin/invite-player`, data);
        return response.data;
    } catch (error) {
        console.error("Error inviting player:", error);
        throw error;
    }
}


// block player - SubAdmin/block-player/43
export const blockPlayer = async (id: number) => {
    try {
        const response = await https.put(`SubAdmin/block-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error blocking player:", error);
        throw error;
    }
}

export const unblockPlayer = async (id: number) => {
    try {
        const response = await https.put(`SubAdmin/unblock-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error unblocking player:", error);
        throw error;
    }
}


// delete player - SubAdmin/remove-player/46

export const deleteSubAdminPlayer = async (id: number) => {
    try {
        const response = await https.delete(`SubAdmin/remove-player/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting player:", error);
        throw error;
    }
}