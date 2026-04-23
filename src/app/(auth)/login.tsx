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
  Modal,
  Alert,
  useColorScheme,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "@/context/AuthContext";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/schema/authSchemas";
import { forgotPassword } from "@/api/auth";

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { email: emailParam, months } = useLocalSearchParams<{
    email?: string;
    months?: string;
  }>();
  const { login } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetPhoneNumber, setResetPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [showApprovalPopup, setShowApprovalPopup] = useState(!!months);
  const [isPopupExpanded, setIsPopupExpanded] = useState(true);
  const [touchY, setTouchY] = useState(0);

  const bgImage = require("@/assets/golf-bgg.jpg");

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: emailParam || "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const loggedUser = await login(data.email, data.password);
      if (!loggedUser) throw new Error("Invalid credentials");

      if (loggedUser.role === "Player" || loggedUser.role?.toLowerCase() === "player") {
        router.replace("/(drawer)/(user)/(tabs)/dashboard");
      } else if (loggedUser.role?.toLowerCase().replace(/[^a-z]/g, '') === "subadmin") {
        router.replace("/(drawer)/(subAdmin)/(tabs)/dashboard" as any);
      } else {
        router.replace("/(drawer)/(admin)/(tabs)/dashboard");
      }
    } catch (error: any) {
      console.log("🚨 HANDLE LOGIN ERROR:", error);
      const errorMsg = error?.response?.data?.message || "Login failed. Please check your credentials.";

      const isPending = errorMsg.toLowerCase().includes("approve") ||
        errorMsg.toLowerCase().includes("pending") ||
        errorMsg.toLowerCase().includes("waiting") ||
        errorMsg.toLowerCase().includes("membership");

      if (isPending || (months && errorMsg.includes("credentials"))) {
        setShowApprovalPopup(true);
        setIsPopupExpanded(true);
      } else {
        setError("root", { message: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={bgImage}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode="cover"
        blurRadius={showResetModal ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingBottom: showApprovalPopup ? (isPopupExpanded ? 280 : 80) : 40
          }}
          scrollEnabled={!showResetModal}
          keyboardShouldPersistTaps="handled"
          style={{ opacity: showResetModal ? 0.3 : 1 }}
        >
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text style={{ color: "#8bc34a", fontSize: 32, fontWeight: "bold" }}>
              Login
            </Text>
            <Text style={{ color: "#8bc34a", fontSize: 16, marginTop: 6 }}>
              Enter your account details
            </Text>
          </View>

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
            <Text
              style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}
            >
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(0,0,0,0.4)"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.email
                      ? "#ef4444"
                      : "rgba(0,0,0,0.1)",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    height: 50,
                    marginBottom: errors.email ? 4 : 20,
                    backgroundColor: "rgba(255,255,255,0.9)",
                    color: "#000",
                  }}
                />
              )}
            />
            {errors.email && (
              <Text
                style={{ color: "#ef4444", fontSize: 12, marginBottom: 14 }}
              >
                {errors.email.message}
              </Text>
            )}

            <Text
              style={{ fontWeight: "600", marginBottom: 6, color: "#374151" }}
            >
              Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: errors.password
                      ? "#ef4444"
                      : "rgba(0,0,0,0.1)",
                    borderRadius: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    height: 50,
                    marginBottom: errors.password ? 4 : 24,
                    backgroundColor: "rgba(255,255,255,0.9)",
                  }}
                >
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
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
              )}
            />
            {errors.password && (
              <Text
                style={{ color: "#ef4444", fontSize: 12, marginBottom: 16 }}
              >
                {errors.password.message}
              </Text>
            )}

            {errors.root && (
              <Text style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, textAlign: "center", fontWeight: "500" }}>
                {errors.root.message}
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 24,
              }}
            >
              <Text style={{ color: "#374151" }}>Remember Me</Text>
              <TouchableOpacity onPress={() => setShowResetModal(true)}>
                <Text style={{ color: "#2e7d32", fontWeight: "600" }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

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
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 17 }}>
                {loading ? "Logging in..." : "Login"}
              </Text>
            </TouchableOpacity>

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

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowResetModal(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: isDark ? "#1f2937" : "#fff",
              width: "100%",
              borderRadius: 20,
              paddingVertical: 16,
              paddingHorizontal: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 15,
              elevation: 10,
              maxHeight: "90%",
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={{ width: "100%" }}>
                <View style={{ alignItems: "center", marginBottom: 10 }}>
                  <View
                    style={{
                      backgroundColor: isDark ? "rgba(139, 195, 74, 0.2)" : "rgba(139, 195, 74, 0.1)",
                      width: 50,
                      height: 50,
                      borderRadius: 9999,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Ionicons name="key-outline" size={28} color="#8bc34a" />
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: "bold", color: isDark ? "#f9fafb" : "#1f2937" }}>
                    Reset Password
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#9ca3af" : "#6b7280",
                      textAlign: "center",
                      marginTop: 2,
                      fontSize: 13,
                    }}
                  >
                    Complete the form to reset your password.
                  </Text>
                </View>

                {resetError ? (
                  <View
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      padding: 8,
                      borderRadius: 10,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <Text style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>
                      {resetError}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontWeight: "600", marginBottom: 4, color: isDark ? "#e5e7eb" : "#374151", fontSize: 12 }}>
                  Email Address
                </Text>
                <TextInput
                  placeholder="Enter email"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    height: 44,
                    marginBottom: 10,
                    backgroundColor: isDark ? "#111827" : "#f9fafb",
                    color: isDark ? "#fff" : "#000",
                    fontSize: 14,
                  }}
                />

                <Text style={{ fontWeight: "600", marginBottom: 4, color: isDark ? "#e5e7eb" : "#374151", fontSize: 12 }}>
                  Phone Number
                </Text>
                <TextInput
                  placeholder="Enter phone"
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  value={resetPhoneNumber}
                  onChangeText={setResetPhoneNumber}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    height: 44,
                    marginBottom: 10,
                    backgroundColor: isDark ? "#111827" : "#f9fafb",
                    color: isDark ? "#fff" : "#000",
                    fontSize: 14,
                  }}
                />

                <Text style={{ fontWeight: "600", marginBottom: 4, color: isDark ? "#e5e7eb" : "#374151", fontSize: 12 }}>
                  New Password
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    height: 44,
                    marginBottom: 10,
                    backgroundColor: isDark ? "#111827" : "#f9fafb",
                  }}
                >
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    style={{ flex: 1, height: "100%", color: isDark ? "#fff" : "#000", fontSize: 14 }}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? "eye" : "eye-off"} size={20} color={isDark ? "#9ca3af" : "#374151"} />
                  </TouchableOpacity>
                </View>

                <Text style={{ fontWeight: "600", marginBottom: 4, color: isDark ? "#e5e7eb" : "#374151", fontSize: 12 }}>
                  Confirm Password
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    height: 44,
                    marginBottom: 16,
                    backgroundColor: isDark ? "#111827" : "#f9fafb",
                  }}
                >
                  <TextInput
                    placeholder="Confirm"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={{ flex: 1, height: "100%", color: isDark ? "#fff" : "#000", fontSize: 14 }}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? "eye" : "eye-off"} size={20} color={isDark ? "#9ca3af" : "#374151"} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={resetLoading}
                  onPress={async () => {
                    setResetError("");
                    if (!resetEmail || !resetPhoneNumber || !newPassword || !confirmPassword) {
                      setResetError("Please fill in all fields");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setResetError("Passwords do not match");
                      return;
                    }
                    try {
                      setResetLoading(true);
                      await forgotPassword({
                        Email: resetEmail,
                        PhoneNumber: resetPhoneNumber,
                        Password: newPassword,
                        ConfirmPassword: confirmPassword,
                      });

                      Alert.alert("Success", "Successfully reset password!", [
                        {
                          text: "OK",
                          onPress: () => {
                            setShowResetModal(false);
                            setResetEmail("");
                            setResetPhoneNumber("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setResetError("");
                          }
                        }
                      ]);
                    } catch (error: any) {
                      const errorMsg = error?.response?.data?.message || "Details not found or an unexpected error occurred.";
                      setResetError(errorMsg);
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  style={{
                    backgroundColor: "#8bc34a",
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    marginBottom: 10,
                    opacity: resetLoading ? 0.7 : 1,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                    {resetLoading ? "Processing..." : "Reset Password"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowResetModal(false)} style={{ paddingVertical: 4 }}>
                  <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", textAlign: "center", fontWeight: "500", fontSize: 14 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {showApprovalPopup && (
        <View style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: isPopupExpanded ? 20 : 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 20,
        }}>
          <View
            onStartShouldSetResponder={(evt) => {
              setTouchY(evt.nativeEvent.pageY);
              return true;
            }}
            onResponderRelease={(evt) => {
              const currentY = evt.nativeEvent.pageY;
              if (touchY - currentY > 50) {
                // Swipe Up
                setIsPopupExpanded(true);
              } else if (currentY - touchY > 50) {
                // Swipe Down
                setIsPopupExpanded(false);
              }
            }}
            style={{
              alignSelf: "center",
              paddingVertical: 5,
              width: "100%",
              alignItems: "center"
            }}
          >
            <TouchableOpacity
              onPress={() => setIsPopupExpanded(!isPopupExpanded)}
              style={{ padding: 5, width: "100%", alignItems: "center" }}
            >
              <Ionicons
                name={isPopupExpanded ? "chevron-down" : "chevron-up"}
                size={28}
                color="#8bc34a"
              />
            </TouchableOpacity>
          </View>

          {isPopupExpanded && (
            <>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#1f2937", textAlign: "center", marginBottom: 10 }}>
                {months ? `${months} Months ` : ""}Membership request is waiting for admin approval.
              </Text>
              <Text style={{ fontSize: 14, color: "#4b5563", textAlign: "center", marginBottom: 20 }}>
                Please confirm payment with admin on WhatsApp.
              </Text>

              <TouchableOpacity
                onPress={() => Linking.openURL(`https://wa.me/919876543210?text=Hello Admin, I am waiting for my account approval. Please check my payment confirmation.`)}
                style={{
                  backgroundColor: "#25D366",
                  flexDirection: "row",
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10
                }}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Open WhatsApp</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
                Your account is pending admin approval after payment confirmation.
              </Text>
            </>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}