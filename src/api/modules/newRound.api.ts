
import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../client";

// get handicap scorecard/handicap/2/26

export const getHandicapDetails = async (teeBoxId: number) => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await client.get(`scorecard/handicap/${userId}/${teeBoxId}`);
        // console.log("handicap response", response.data);

        return response.data;
    } catch (error) {
        console.error("Fetching handicap scorecard Error:", error);
        throw error;
    }
};


// get scorecard details scorecard/userId/teeBoxId/courseId

export const getScoreCardDetails = async (teeBoxId: number, courseId: number, holes: string) => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        const response = await client.get(`scorecard/${userId}/${teeBoxId}/${courseId}?holes=${holes}`);
        // console.log("scorecard response", response.data);

        return response.data;
    } catch (error) {
        console.error("Fetching scorecard Error:", error);
        throw error;
    }
};


//  get course by search - CourseAdmin/external/search?query=delhi

export const getCourseBySearch = async (courseName: string) => {
    try {
        const response = await client.get(`CourseAdmin/external/search?query=${courseName}`);
        console.log("course by search response", response.data);

        return response.data;
    } catch (error) {
        console.error("Fetching course by search Error:", error);
        throw error;
    }
};

//  save searched course - CourseAdmin/external/import

export const saveExternalCourse = async (data: any) => {
            console.log("dataaaa",data);

    try {
        
        const response = await client.post(`CourseAdmin/external/import`,data);
        console.log("save searched course response", response.data);

        return response.data;
    } catch (error) {
        console.error("Saving searched course Error:", error);
        throw error;
    }
};

