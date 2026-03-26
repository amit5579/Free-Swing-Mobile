import React, { useState, useContext } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const { login, user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const bgImage = require("/assets/golf-bgg.jpg");

  const handleLogin = async () => {
    try {
      setLoading(true);

      console.log("🟢 Login button pressed");
      console.log("📧 Email entered:", email);
      console.log("🔑 Password entered:", password);

      const loggedUser = await login(email, password);

      console.log("📦 Login function returned:", loggedUser);

      if (!loggedUser) {
        console.log("❌ Login returned null");
        throw new Error("Invalid credentials");
      }

      console.log("✅ User role:", loggedUser.role);

      if (loggedUser.role === "Player") {
        router.replace("/(drawer)/(user)/(tabs)/dashboard");
      } else {
        router.replace("/(drawer)/(admin)/(tabs)/dashboard");
      }

    } catch (error) {
      console.log("🚨 HANDLE LOGIN ERROR:", error);
      alert("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={bgImage}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>
              Login
            </Text>
            <Text style={{ color: "#e0f2d9", fontSize: 16, marginTop: 6 }}>
              Enter your account details
            </Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderWidth: 1,
              borderColor: "rgba(240,255,240,0.9)",
              borderRadius: 24,
              padding: 28,
              marginHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          >
            {/* Email */}
            <Text
              style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}
            >
              Email
            </Text>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.1)",
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 50,
                marginBottom: 20,
                backgroundColor: "rgba(255,255,255,0.9)",
                color: "#000",
              }}
            />

            {/* Password */}
            <Text
              style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}
            >
              Password
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.1)",
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                height: 50,
                marginBottom: 24,
                backgroundColor: "rgba(255,255,255,0.9)",
              }}
            >
              <TextInput
                placeholder="Enter your password"
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={{ flex: 1, height: "100%", color: "#000" }}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={22}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            {/* Remember / Forgot */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Text style={{ color: "#374151" }}>Remember Me</Text>
              <Text style={{ color: "#2e7d32", fontWeight: "600" }}>
                Forgot Password?
              </Text>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#a5d67a" : "#8bc34a",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 4,
                opacity: loading ? 0.7 : 1,
              }}
              onPress={handleLogin}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

            {/* Signup */}
            <Text style={{ textAlign: "center", color: "#374151" }}>
              Don't have an Account?{" "}
              <Text
                style={{ color: "#2e7d32", fontWeight: "600" }}
                onPress={() => router.push("/signup")}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}