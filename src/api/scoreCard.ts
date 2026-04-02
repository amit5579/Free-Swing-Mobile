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