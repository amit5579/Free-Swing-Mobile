// src/context/AuthContext.tsx
import React, { createContext, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type UserType = {
  id: number;
  username: string;
  role: string;
  token: string;
};

type AuthContextType = {
  user: UserType | null;
  login: (email: string, password: string) => Promise<UserType | null>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => null,
  logout: () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

const login = async (email: string, password: string): Promise<UserType | null> => {
  try {
    console.log("1️⃣ LOGIN FUNCTION STARTED");
    console.log("2️⃣ Email:", email);
    console.log("3️⃣ Password:", password);

    console.log("4️⃣ Sending API request...");

    const response = await fetch("https://kolve18freeswing.com/api/Auth/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Email: email.trim(),
        Password: password.trim(),
      }),
    });

    console.log("5️⃣ API request sent");
    console.log("6️⃣ Response status:", response.status);

    const text = await response.text();
    console.log("7️⃣ Raw API response:", text);

    const data = JSON.parse(text);
    console.log("8️⃣ Parsed JSON:", data);

    if (!data.token) {
      console.log("9️⃣ Token not found in response");
      return null;
    }

    console.log("🔟 Token received:", data.token);

    const userData: UserType = {
      id: data.id,
      username: data.username,
      role: data.role,
      token: data.token,
    };

    console.log("1️⃣1️⃣ User data created:", userData);

    console.log("1️⃣2️⃣ Saving user in context...");
    setUser(userData);

    console.log("1️⃣3️⃣ Saving token in AsyncStorage...");
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("userId", data.id.toString());
    await AsyncStorage.setItem("role",data.role);
    console.log("1️⃣4️⃣ Login successful");

    return userData;

  } catch (error) {
    console.log("❌ LOGIN ERROR:", error);
    return null;
  }
};

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("userId");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};