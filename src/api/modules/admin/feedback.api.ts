import client from "../../client";


// get feedback list endpoint : Feedback/manage
export const getFeedback = async () => {
    try {
        const response = await client.get(`Feedback/manage`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching feedback Error:", error);
        throw error;
    }
};



// update feedback status endpoint : Feedback/1/manage
export const updateFeedback = async (feedbackId: number, adminResponse: string, status: string) => {
    try {
        const response = await client.put(`Feedback/${feedbackId}/manage`, { adminResponse, status });
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Updating feedback Error:", error);
        throw error;
    }
};


// send feedback to admin - post - Feedback category , subject , message
export const sendFeedback = async (category: string, subject: string, message: string) => {
    try {
        const response = await client.post(`Feedback`, { category, subject, message });
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Sending feedback Error:", error);
        throw error;
    }
};


// get feedback history - Feedback/mine
// {
//         "id": 3,
//         "userId": 2,
//         "username": "narender",
//         "email": "narender@mail.com",
//         "role": "Player",
//         "category": "Bug",
//         "subject": "bugcheck test",
//         "message": "testing the contact admin flow with bug category.",
//         "status": "Open",
//         "adminResponse": null,
//         "createdAt": "2026-03-25T04:44:57.9404074",
//         "updatedAt": null
//     }
export const getFeedbackHistory = async () => {
    try {
        const response = await client.get(`Feedback/mine`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching feedback history Error:", error);
        throw error;
    }
};