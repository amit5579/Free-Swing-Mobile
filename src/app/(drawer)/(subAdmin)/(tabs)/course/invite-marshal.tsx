import React, { useState } from "react";
import {
  useColorScheme,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Watermark from "@/components/watermark";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { invitePlayer } from "@/api/subAdmin/dashboard";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteMarshalSchema, InviteMarshalFormData } from "@/schema/marshalSchema";

export default function InviteMarshalPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteMarshalFormData>({
    resolver: zodResolver(inviteMarshalSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      mobileNumber: "",
    },
  });

  const [slope] = useState("120");
  const [rating] = useState("68.8");

  const onSubmit = async (data: InviteMarshalFormData) => {
    try {
      setLoading(true);
      await invitePlayer({
        username: data.fullName,
        email: data.email,
        password: data.password,
        mobileNumber: data.mobileNumber || "",
        slope: parseFloat(slope),
        rating: parseFloat(rating),
        role: "CourseMarshal",
      });
      Alert.alert("Success", "Course Marshal invited successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to invite marshal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f2f2f2" }}>
      <Watermark />

      <VStack style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        <HStack style={{ alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e0e0e0",
            }}
          >
            <Ionicons name="chevron-back" size={24} color={isDark ? "#fff" : "#111"} />
          </TouchableOpacity>
          <VStack>
            <Text style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#111", letterSpacing: -0.5 }}>
              Invite Marshal
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? "#aaa" : "#6b7280" }}>
              Fill in the details to create a new marshal
            </Text>
          </VStack>
        </HStack>
      </VStack>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.formContainer}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        >
          <VStack style={styles.card}>
            <VStack style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Full Name *</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: isDark ? "#fff" : "#000", borderColor: errors.fullName ? "#ef4444" : (isDark ? "#333" : "#e0e0e0"), backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff" }]}
                    placeholder="Enter full name"
                    placeholderTextColor={isDark ? "#555" : "#999"}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
            </VStack>

            <VStack style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Email *</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: isDark ? "#fff" : "#000", borderColor: errors.email ? "#ef4444" : (isDark ? "#333" : "#e0e0e0"), backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff" }]}
                    placeholder="email@example.com"
                    placeholderTextColor={isDark ? "#555" : "#999"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </VStack>

            <VStack style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Password *</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: isDark ? "#fff" : "#000", borderColor: errors.password ? "#ef4444" : (isDark ? "#333" : "#e0e0e0"), backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff" }]}
                    placeholder="Set password"
                    placeholderTextColor={isDark ? "#555" : "#999"}
                    secureTextEntry
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </VStack>

            <VStack style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Mobile</Text>
              <Controller
                control={control}
                name="mobileNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, { color: isDark ? "#fff" : "#000", borderColor: errors.mobileNumber ? "#ef4444" : (isDark ? "#333" : "#e0e0e0"), backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#fff" }]}
                    placeholder="Phone number"
                    placeholderTextColor={isDark ? "#555" : "#999"}
                    keyboardType="phone-pad"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text.replace(/[^0-9]/g, ""))}
                    value={value}
                  />
                )}
              />
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber.message}</Text>}
            </VStack>

            <HStack style={{ gap: 12 }}>
              <VStack style={[styles.inputGroup, { flex: 1 }]} pointerEvents="none">
                <Text style={[styles.label, { color: isDark ? "rgba(170,170,170,0.5)" : "#999" }]}>Course Slope</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#666" : "#888", borderColor: isDark ? "#222" : "#eee", backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "#f9f9f9" }]}
                  placeholder="120"
                  placeholderTextColor={isDark ? "#333" : "#ccc"}
                  keyboardType="numeric"
                  value={slope}
                  editable={false}
                />
              </VStack>

              <VStack style={[styles.inputGroup, { flex: 1 }]} pointerEvents="none">
                <Text style={[styles.label, { color: isDark ? "rgba(170,170,170,0.5)" : "#999" }]}>Course Rating</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? "#666" : "#888", borderColor: isDark ? "#222" : "#eee", backgroundColor: isDark ? "rgba(255,255,255,0.01)" : "#f9f9f9" }]}
                  placeholder="68.8"
                  placeholderTextColor={isDark ? "#333" : "#ccc"}
                  keyboardType="numeric"
                  value={rating}
                  editable={false}
                />
              </VStack>
            </HStack>

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Sending..." : "Create Course Marshal"}
              </Text>
            </TouchableOpacity>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
  },
  card: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 45,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: "#8BC34A",
    height: 50,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#8BC34A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
});

