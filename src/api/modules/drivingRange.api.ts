import client from "../client";

export const getDrivingRangeSlots = async (date: string, subAdminId: number) => {
    try {
        const response = await client.get(`DrivingRange/slots?date=${date}&subAdminId=${subAdminId}`);
        return response.data;
    } catch (error) {
        console.error("Fetching driving range slots Error:", error);
        throw error;
    }
};

export const bookDrivingRangeSlot = async (payload: any) => {
    try {
        const response = await client.post(`DrivingRange/book`, payload);
        return response.data;
    } catch (error) {
        console.error("Booking driving range slot Error:", error);
        throw error;
    }
};
