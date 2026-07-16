import AsyncStorage from "@react-native-async-storage/async-storage";
import client from "../client";

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

    const response = await client.post("scorecard/save", finalPayload);
    // console.log("response sent sucessfully",response.data);

    return response.data;
  } catch (error) {
    console.error("Saving scorecard Error:", error);
    throw error;
  }
};

export const getScorecardHandicap = async (teeBoxId: number) => {
  try {
    const userId = await AsyncStorage.getItem("userId");

    if (!userId) {
      throw new Error("User ID not found");
    }
    const response = await client.get(`scorecard/handicap/${userId}/${teeBoxId}`);
    return response.data;
  } catch (error) {
    console.error("Getting scorecard handicap Error:", error);
    throw error;
  }
}
export const getSubScorecardHandicap = async (userId: number, teeBoxId: number) => {
  try {
    const response = await client.get(`scorecard/handicap/${userId}/${teeBoxId}`);
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
    const response = await client.get(`scorecard/open/${tournamentId}/${userId}`);
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
    const response = await client.get(`scorecard/details/${scorecardId}`);
    // console.log("Fetching scorecard details:", response.data);
    return response.data;
  } catch (error) {
    console.error("Fetching scorecard details Error:", error);
    throw error;
  }
};

// export const updateAdminScores = async (scorecardId: number, holeScores: Record<number, number>) => {
//   try {
//     console.log("ssdd",scorecardId);
    
//     const response = await client.put(`scorecard/admin-edit/${scorecardId}`, { scores: holeScores });
//     return response.data;
//   } catch (error) {
//     console.error("Updating admin scores Error:", error);
//     throw error;
//   }
// };
export const updateAdminScores = async (tournamentId: number, userId:number, holeScores: Record<number, number>) => {
  try {  
    const response = await client.put(`scorecard/admin-edit/${tournamentId}/${userId}`, { scores: holeScores });
    return response.data;
  } catch (error) {
    console.error("Updating admin scores Error:", error);
    throw error;
  }
};
