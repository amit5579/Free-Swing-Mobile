import AsyncStorage from "@react-native-async-storage/async-storage";
import https from "./https";

// get teetimeslots TeeTime/slots/2?date=2026-03-25&tee=1 qparams : date 2026-03-25 tee 1

// getCourses - course?onlyWithSubAdmin=true

export const getSubAdminCourses = async () => {
    try {
        const response = await https.get(`course?onlyWithSubAdmin=true`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching sub admin courses Error:", error);
        throw error;
    }
};

// get tee time and seats - TeeTime/slots/2?date=2026-03-26&tee=1

export const getTeeTimeSeats = async (date: string, tee: number) => {
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

export const bookSeat = async (courseId: number, date: string, seatNumber: number, tee: number, timeSlot: string) => {
    try {
        const response = await https.post(`TeeTime/book`, {
            courseId,
            date,
            seatNumber,
            tee,
            timeSlot
        });
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Booking seat Error:", error);
        throw error;
    }
};

// cancel seat booking - TeeTime/cancel/46

export const cancelSeatBooking = async (bookingId: number) => {
    try {
        const response = await https.delete(`TeeTime/cancel/${bookingId}`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Canceling seat booking Error:", error);
        throw error;
    }
};