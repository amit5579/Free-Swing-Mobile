import https from "../https";


// get feedback list endpoint : Feedback/manage
export const getFeedback = async () => {
    try {
        const response = await https.get(`Feedback/manage`);
        return response.data;
    } catch (error) {
        console.error("Fetching feedback Error:", error);
        throw error;
    }
};



// update feedback status endpoint : Feedback/1/manage
export const updateFeedback = async (feedbackId: number, data: any) => {
    try {
        const response = await https.put(`Feedback/${feedbackId}/manage`, data);
        return response.data;
    } catch (error) {
        console.error("Updating feedback Error:", error);
        throw error;
    }
};