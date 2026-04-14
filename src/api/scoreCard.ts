import AsyncStorage from "@react-native-async-storage/async-storage";
import https from "./https";

export const saveScoreCard = async (payload: any[]) => {
  try {
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      throw new Error("User ID not found");
    }

    const finalPayload = payload.map((item) => ({
      ...item,
      userId: Number(userId),
    }));

    const response = await https.post("scorecard/save", finalPayload);
    console.log("response sent sucessfully",response.data);
    
    return response.data;
  } catch (error) {
    console.error("Saving scorecard Error:", error);
    throw error;
  }
};



// scorecard of user tournament ------------------------------------------

// scorecard/handicap/userId/teeBoxId

export const getScorecardHandicap = async (teeBoxId: number) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      throw new Error("User ID not found");
    }
        const response = await https.get(`scorecard/handicap/${userId}/${teeBoxId}`);
        return response.data;
    } catch (error) {
        console.error("Getting scorecard handicap Error:", error);
        throw error;
    }
}
export const getSubScorecardHandicap = async (teeBoxId: number) => {
    try {
      const userId = await AsyncStorage.getItem("userId");
console.log("userId",userId);
console.log("teeBoxId",teeBoxId);

    if (!userId) {
      throw new Error("User ID not found");
    }
        const response = await https.get(`scorecard/handicap/${userId}/${teeBoxId}`);
        return response.data;
    } catch (error) {
        console.error("Getting scorecard handicap Error:", error);
        throw error;
    }
}



// getScorecardOpen - all tables details
// scorecard/open/tournamentId/userId

export const getScoreCardOpen = async (tournamentId: number) => {
    try {
      const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      throw new Error("User ID not found");
    }
        const response = await https.get(`scorecard/open/${tournamentId}/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Getting scorecard open Error:", error);
        throw error;
    }
}



// scorecard-tournament-user
// get scorecard of player: scorecard/details/1936

export const getScorecardDetails = async (scorecardId: number) => {
    try {
        const response = await https.get(`scorecard/details/${scorecardId}`);
        // console.log("Fetching scorecard details:", response.data);
        return response.data;
    } catch (error) {
        console.error("Fetching scorecard details Error:", error);
        throw error;
    }
};
