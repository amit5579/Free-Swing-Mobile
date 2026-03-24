import https from "../https";


// get feedback list endpoint : Feedback/manage
export const getFeedback = async () => {
    try {
        const response = await https.get(`Feedback/manage`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching feedback Error:", error);
        throw error;
    }
};



// update feedback status endpoint : Feedback/1/manage
export const updateFeedback = async (feedbackId: number, adminResponse: string , status:string) => {
    try {
        const response = await https.put(`Feedback/${feedbackId}/manage`, {adminResponse,status});
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Updating feedback Error:", error);
        throw error;
    }
};