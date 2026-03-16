import https from "./https";

export const getAdminProfile = async () => {
    try {
        const response = await https.get(`User/1`);
        return response.data;

    } catch (error) {
        console.error("Fetching admin profile Error:", error);
        throw error;
    }
};
