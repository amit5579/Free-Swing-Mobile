import https from "./https";

export const getAdminProfile = async () => {
    try {
        const response = await https.get(`User/1`);
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