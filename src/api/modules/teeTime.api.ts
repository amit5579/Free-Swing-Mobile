import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../client";

// get teetimeslots TeeTime/slots/2?date=2026-03-25&tee=1 qparams : date 2026-03-25 tee 1

// getCourses - course?onlyWithSubAdmin=true

export const getAllCourses = async () => {
    try {
        const response = await client.get(`course?onlyWithSubAdmin=false`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching sub admin courses Error:", error);
        throw error;
    }
};
export const getSubAdminCourses = async () => {
    try {
        const response = await client.get(`course?onlyWithSubAdmin=true`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching sub admin courses Error:", error);
        throw error;
    }
};

// get tee time and seats - TeeTime/slots/2?date=2026-03-26&tee=1

export const getTeeTimeSeats = async (selectedCourse: number, date: string, tee: number) => {
    try {
        const response = await client.get(`TeeTime/slots/${selectedCourse}?date=${date}&tee=${tee}`);
        return response.data;
    } catch (error) {
        console.error("Fetching tee time slots Error:", error);
        throw error;
    }
};


// subadmin tees handler
export const getSubAdminTeeTimeSeats = async (courseId: number, date: string, tee: number,) => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }


        const response = await client.get(`TeeTime/slots/${courseId}?date=${date}&tee=${tee}`);

        // console.log("fffff", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching tee time slots Error:", error);
        throw error;
    }
};


// get booking status - booking-status?date=2026-03-25 qparams : date 2026-03-25


export const getBookingStatus = async (date: string) => {
    try {
        const response = await client.get(`booking-status?date=${date}`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching booking status Error:", error);
        throw error;
    }
};

// book seat - TeeTime/book payload - courseId: 2, date: "2026-03-25", timeSlot: "06:00", seatNumber: 1, tee: 1

export const bookSeat = async (courseId: number, date: string, memberCategory: string, seatNumber: number, tee: number, timeSlot: string) => {

    try {
        const response = await client.post(`TeeTime/book`, {
            courseId,
            date,
            memberCategory,
            seatNumber,
            tee,
            timeSlot,

        });
        console.log("fffff",response.data);
        return response.data;
    } catch (error: any) {
        console.error("Booking seat Error:", error.response?.data || error.message);
        throw error;
    }
};

// tee booking ss
export const uploadTeeBookingScreenshot = async (bookingId: number, uri: string, type: string, name: string) => {
    try {
        const formData = new FormData();
        formData.append("image", {
            uri,
            name,
            type,
        } as any);

        const response = await client.post(`TeeTime/${bookingId}/upload-screenshot`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Upload Tee Booking Screenshot Error:", error);
        throw error;
    }
};

// cancel seat booking - TeeTime/cancel/46

export const cancelSeatBooking = async (bookingId: number) => {
    try {
        const response = await client.delete(`TeeTime/cancel/${bookingId}`);
        // console.log("fffff",response.data);
        return response.data;
    } catch (error) {
        console.error("Canceling seat booking Error:", error);
        throw error;
    }
};

// get my bookings
export const getMyTeeTimeBookings = async () => {
    try {
        const response = await client.get(`TeeTime/my-bookings`);
        return response.data;
    } catch (error) {
        console.error("Fetching my tee time bookings Error:", error);
        throw error;
    }
};