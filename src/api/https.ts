// import axios from "axios";

// const https = axios.create({
//     baseURL : process.env.EXPO_PUBLIC_API_BASE_URL
// });

// export default https;


import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const https = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});




// REQUEST INTERCEPTOR
https.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// RESPONSE INTERCEPTOR (optional)
https.interceptors.response.use(
  (response) => response,
  async (error) => {

    if (error.response?.status === 401) {
      // token expired logic
      await AsyncStorage.removeItem("token");
    }

    return Promise.reject(error);
  }
);

export default https;