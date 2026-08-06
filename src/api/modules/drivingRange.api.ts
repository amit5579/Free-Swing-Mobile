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

export const uploadScreenshot = async (bookingId: number, fileUri: string, fileType: string, fileName: string) => {
    try {
        const formData = new FormData();
        formData.append("file", {
            uri: fileUri,
            type: fileType,
            name: fileName,
        } as any);

        const response = await client.post(`DrivingRange/${bookingId}/upload-screenshot`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Upload Screenshot Error:", error);
        throw error;
    }
};

export const getMyDrivingRangeBookings = async () => {
    try {
        const response = await client.get(`DrivingRange/my-bookings`);
        return response.data;
    } catch (error) {
        console.error("Fetching my driving range bookings Error:", error);
        throw error;
    }
};

export const cancelDrivingRangeBooking = async (bookingId: number) => {
    try {
        const response = await client.delete(`DrivingRange/cancel/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error("Canceling driving range booking Error:", error);
        throw error;
    }
};
