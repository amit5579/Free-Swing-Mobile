import React, { createContext, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser } from "@/api/modules/auth.api";

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
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  const login = async (
    email: string,
    password: string,
  ): Promise<UserType | null> => {
    try {
      const data = await loginUser({
        Email: email.trim(),
        Password: password.trim(),
      });

      if (!data?.token) {
        return null;
      }

      const userData: UserType = {
        id: data.id,
        username: data.username,
        role: data.role,
        token: data.token,
      };

      setUser(userData);
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userId", data.id.toString());
      await AsyncStorage.setItem("role", data.role);
      await AsyncStorage.setItem("username", data.username);

      return userData;
    } catch (error) {
      console.log("❌ LOGIN ERROR:", error);
      throw error;
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
