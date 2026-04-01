
import AsyncStorage from "@react-native-async-storage/async-storage";
import https from "./https";

// get handicap scorecard/handicap/2/26

export const getHandicapDetails = async (teeBoxId: number) => {
    try {
         const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not found in storage");
    }
        const response = await https.get(`scorecard/handicap/${userId}/${teeBoxId}`);
        // console.log("handicap response", response.data);
        
        return response.data;
    } catch (error) {
        console.error("Fetching handicap scorecard Error:", error);
        throw error;
    }
};


// get scorecard details scorecard/userId/teeBoxId/courseId

export const getScoreCardDetails = async (teeBoxId: number, courseId: number) => {
    try {
         const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not found in storage");
    }
        const response = await https.get(`scorecard/${userId}/${teeBoxId}/${courseId}`);
        // console.log("scorecard response", response.data);
        
        return response.data;
    } catch (error) {
        console.error("Fetching scorecard Error:", error);
        throw error;
    }
};