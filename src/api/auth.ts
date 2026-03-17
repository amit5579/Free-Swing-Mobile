// // src/api/login.ts
// import https from "./https";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// export type UserType = {
//   id: number;
//   username: string;
//   role: string;
//   token: string;
// };

// export const loginApi = async (email: string, password: string): Promise<UserType | null> => {
//   try {
//     const response = await https.post("/Auth/login", {
//       Email: email.trim(),
//       Password: password.trim(),
//     });

//     const data = response.data;

//     if (!data.token) return null;

//     const userData: UserType = {
//       id: data.id,
//       username: data.username,
//       role: data.role,
//       token: data.token,
//     };

//     // Save token & userId for persistence
//     await AsyncStorage.setItem("token", data.token);
//     await AsyncStorage.setItem("userId", data.id.toString());

//     return userData;
//   } catch (error) {
//     console.log("❌ loginApi error:", error);
//     return null;
//   }
// };