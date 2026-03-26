import AsyncStorage from "@react-native-async-storage/async-storage";
import https from "./https";

// get teetimeslots TeeTime/slots/2?date=2026-03-25&tee=1 qparams : date 2026-03-25 tee 1

export const getTeeTimeSlots = async (date: string, tee: number) => {
    try {

        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await https.get(`TeeTime/slots/${userId}?date=${date}&tee=${tee}`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching tee time slots Error:", error);
        throw error;
    }
};


// get booking status - booking-status?date=2026-03-25 qparams : date 2026-03-25


export const getBookingStatus = async (date: string) => {
    try {
        const response = await https.get(`booking-status?date=${date}`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching booking status Error:", error);
        throw error;
    }
};

// book seat - TeeTime/book payload - courseId: 2, date: "2026-03-25", timeSlot: "06:00", seatNumber: 1, tee: 1

export const bookSeat = async (courseId: number, date: string, timeSlot: string, seatNumber: number, tee: number) => {
    try {
        const response = await https.post(`TeeTime/book`, {
            courseId,
            date,
            timeSlot,
            seatNumber,
            tee
        });
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Booking seat Error:", error);
        throw error;
    }
};
