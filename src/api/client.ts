import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import ENV from "../config/env";
import Toast from "react-native-toast-message";

const client = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  async (config) => {
    console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url || ""}`);
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
      const isFormData =
        config.data instanceof FormData ||
        (config.data &&
          typeof config.data === "object" &&
          (Array.isArray((config.data as any)._parts) || "_parts" in (config.data as any)));

      if (isFormData) {
        if (config.headers && typeof config.headers.delete === "function") {
          config.headers.delete("Content-Type");
          config.headers.delete("content-type");
        } else if (config.headers) {
          delete config.headers["Content-Type"];
          delete config.headers["content-type"];
        }
      }
    } catch (err) {
      console.warn("Error attaching auth token to request:", err);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirecting = false;
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isUnauthorized = error.response?.status === 401;

    // Only redirect to login and clear credentials on 401 Unauthorized (session expired)
    if (isUnauthorized && !isRedirecting) {
      isRedirecting = true;

      console.log("🚨 Session expired (401) - redirecting to login");
      Toast.show({
        type: "error",
        text1: "Session expired",
        text2: "Please login again to continue",
      });
      await AsyncStorage.multiRemove(["token", "userId", "role", "username"]);

      router.replace("/(auth)/login");
      setTimeout(() => {
        isRedirecting = false;
      }, 5000);
    } else {
      console.log(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ""}${error.config?.url || ""} -> ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default client;