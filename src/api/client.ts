import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import ENV from "../config/env";

const client = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR (optional)
// client.interceptors.response.use(
//   (response) => response,
//   async (error) => {

//     if (error.response?.status === 401) {
//       // token expired logic
//       await AsyncStorage.removeItem("token");
//     }

//     return Promise.reject(error);
//   }
// );


let isRedirecting = false;
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isUnauthorized = error.response?.status === 401;
    const isTimeout =
      error.code === "ECONNABORTED" ||
      error.message?.toLowerCase().includes("timeout");

    // // ⏰ Timeout → go to login
    // if (isTimeout) {
    //   console.log("⏰ Timeout - redirecting to login");

    //   await AsyncStorage.removeItem("token");
    //   await AsyncStorage.removeItem("userId");

    //   router.replace("/(auth)/login");
    //   return Promise.reject(error);
    // }

    // // 🔒 401 → go to login
    // if (isUnauthorized) {
    //   console.log("🚨 Unauthorized - redirecting to login");

    //   await AsyncStorage.removeItem("token");
    //   await AsyncStorage.removeItem("userId");

    //   router.replace("/(auth)/login");
    // }

    if ((isTimeout || isUnauthorized) && !isRedirecting) {
      isRedirecting = true;

      console.log("🚨 Session expired or timeout - redirecting");

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");

      router.replace("/(auth)/login");
      setTimeout(() => {
        isRedirecting = false;
      }, 5000);
    }

    return Promise.reject(error);
  }
);

export default client;