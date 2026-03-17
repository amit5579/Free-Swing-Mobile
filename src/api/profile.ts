import https from "./https";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAdminProfile = async () => {
    try {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in storage");
        }
        
        const response = await https.get(`User/${userId}`);
        console.log('getAdminProfile response lag', response);
        return response.data;
    } catch (error) {
        console.error("Fetching admin profile Error:", error);
        throw error;
    }
};

export const uploadProfileImage = async (image: any) => {
  const formData = new FormData();

   formData.append("profileImage", {
    uri: image.uri,
    name: image.fileName || "profile.jpg",
    type: image.mimeType || "image/jpeg",
  } as any);

  const response = await https.post("User/upload-profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
console.log("profile response:",response);

  return response.data;
};