import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { ThemedText } from "@/components/themed-text";

import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";

interface BankDetail {
  name: string;
  website: string;
  img: any;
  url: string;
  type?: "link" | "email" | "phone";
}

export default function BookGameScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankDetail | null>(null);

  const bankDetails: BankDetail[] = [
    {
      name: "ICICI Bank",
      website: "www.golftripz.com",
      img: require("../../../../../../assets/images/bankImages/ICICI_Bank_Logo.svg.png"),
      url: "https://teetimes.golftripz.com/",
      type: "link",
    },
    {
      name: "SBI",
      website: "www.thriwe.com",
      img: require("../../../../../../assets/images/bankImages/sbi-img.png"),
      url: "https://teepassindia.thriwe.com/",
      type: "link",
    },
    {
      name: "IndusInd Bank",
      website: "www.apexlynx.net",
      img: require("../../../../../../assets/images/bankImages/IndusInd-Bank.jpg"),
      url: "https://indusindgolf.apexlynx.net/",
      type: "link",
    },
    {
      name: "HSBC",
      website: "www.thriwe.com",
      img: require("../../../../../../assets/images/bankImages/HSBC_logo_(2018).svg.png"),
      url: "https://golfpass.thriwe.com/login",
      type: "link",
    },
    {
      name: "HDFC Bank",
      website: "infinia.support@smartbuyoffers.co",
      img: require("../../../../../../assets/images/bankImages/hdfc-img.jpg"),
      url: "infinia.support@smartbuyoffers.co",
      type: "email",
    },
    {
      name: "American Express",
      website: "1800 102 6263",
      img: require("../../../../../../assets/images/bankImages/American-Express.png"),
      url: "1800 102 6263",
      type: "phone",
    },
    {
      name: "Axis Bank",
      website: "www.extraordinaryweekends.com",
      img: require("../../../../../../assets/images/bankImages/axis-bank.png"),
      url: "https://www.extraordinaryweekends.com/",
      type: "link",
    },
    {
      name: "Standard Chartered",
      website: "www.scb.golflan.com",
      img: require("../../../../../../assets/images/bankImages/standard-chartered-bank.png"),
      url: "https://scb.golflan.com/",
      type: "link",
    },
    {
      name: "IDFC First Bank",
      website: "www.idfcfirst.truztee.com",
      img: require("../../../../../../assets/images/bankImages/idfc-first-bank-logo.png"),
      url: "https://idfcfirst.truztee.com/Account/Login",
      type: "link",
    },
  ];

  const getActionType = (bank: BankDetail): "email" | "phone" | "link" => {
    if (bank.type) return bank.type;
    if (bank.url.includes("@") || bank.name.toLowerCase().includes("hdfc")) {
      return "email";
    }
    if (
      /^[\d\s+\-()]+$/.test(bank.url.trim()) ||
      bank.name.toLowerCase().includes("american express")
    ) {
      return "phone";
    }
    return "link";
  };

  const openGmailApp = async (email?: string) => {
    const targetEmail = (
      email ||
      selectedBank?.url ||
      "infinia.support@smartbuyoffers.co"
    ).trim();
    const mailtoUrl = `mailto:${targetEmail}`;
    const gmailIosUrl = `googlegmail:///co?to=${targetEmail}`;

    if (Platform.OS === "ios") {
      try {
        const canOpen = await Linking.canOpenURL(gmailIosUrl);
        if (canOpen) {
          await Linking.openURL(gmailIosUrl);
          return;
        }
      } catch (_) {}
    }

    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error("Failed to open email app:", error);
      const webGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        targetEmail
      )}`;
      try {
        await Linking.openURL(webGmailUrl);
      } catch (_) {
        Alert.alert(
          "Unable to Open Email",
          `Please email support at: ${targetEmail}`
        );
      }
    }
  };

  const handleBankPress = async (bank: BankDetail) => {
    const actionType = getActionType(bank);

    if (actionType === "phone") {
      const cleanNumber = bank.url.replace(/[^0-9+]/g, "");
      const telUrl = `tel:${cleanNumber}`;
      try {
        await Linking.openURL(telUrl);
      } catch (error) {
        console.error("Failed to open dialer:", error);
        Alert.alert("Unable to open dialer", `Please call ${bank.url}`);
      }
      return;
    }

    if (actionType === "email") {
      setSelectedBank(bank);
      await openGmailApp(bank.url);
      return;
    }

    let targetUrl = bank.url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    try {
      await Linking.openURL(targetUrl);
    } catch (error) {
      console.error("Failed to open URL:", error);
      Toast.show({
        type: "error",
        text1: "Unable to open link",
        text2: targetUrl,
      });
    }
  };

  const mailOptions = [
    {
      id: "gmail",
      name: "Gmail",
      description: "Compose in Gmail app",
      icon: "logo-google" as const,
      iconBg: "#EA433520",
      iconColor: "#EA4335",
      onPress: async () => {
        setEmailModalVisible(false);
        await openGmailApp(selectedBank?.url);
      },
    },
    {
      id: "default",
      name: "Default Mail App",
      description: "Open in system default email client",
      icon: "mail-outline" as const,
      iconBg: "#8BC34A20",
      iconColor: "#8BC34A",
      onPress: async () => {
        setEmailModalVisible(false);
        await openGmailApp(selectedBank?.url);
      },
    },
  ];

  const renderHeader = () => (
    <Box
      style={{
        backgroundColor: isDark ? "#161618" : "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
      }}
    >
      <VStack
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          alignItems: "center",
        }}
      >
        {/* 🧠 TITLE */}
        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
            color: isDark ? "#fff" : "#020617",
          }}
        >
          Book a Complimentary Game
        </ThemedText>

        {/* 📌 SUBTITLE */}
        <ThemedText
          style={{
            marginTop: 6,
            fontSize: 13,
            color: isDark ? "#94a3b8" : "#64748b",
            textAlign: "center",
            maxWidth: "90%",
          }}
        >
          Select your bank to be redirected to the booking portal
        </ThemedText>
      </VStack>
    </Box>
  );

  return (
    <ThemedView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#161618" : "#FFFFFF",
      }}
    >
      {/* Header */}
      {renderHeader()}
      <Watermark />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="px-4 pt-6 pb-20">
          {/* Bank List */}
          <VStack className="gap-3">
            {bankDetails.map((bank, index) => {
              const actionType = getActionType(bank);

              return (
                <Pressable key={index} onPress={() => handleBankPress(bank)}>
                  <Box
                    style={{
                      ...styles.bankRow,
                      backgroundColor: isDark
                        ? "rgba(15, 23, 42, 0.7)"
                        : "rgba(255, 255, 255, 0.7)",
                      borderColor: isDark
                        ? "rgba(139, 195, 74, 0.35)"
                        : "rgba(139, 195, 74, 0.45)",
                      borderWidth: 1,
                      borderRadius: 16,
                      shadowColor: "#000",
                    }}
                  >
                    <HStack className="items-center justify-between">
                      {/* Left Section */}
                      <HStack className="items-center flex gap-5" style={{ flex: 1 }}>
                        <Image
                          source={bank.img}
                          style={styles.logo}
                          resizeMode="contain"
                        />

                        <VStack className="ml-3" style={{ flex: 1 }}>
                          <ThemedText
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                            }}
                          >
                            {bank.name}
                          </ThemedText>

                          <ThemedText
                            style={{
                              fontSize: 12,
                              opacity: 0.6,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {bank.website}
                          </ThemedText>
                        </VStack>
                      </HStack>

                      {/* Right Action Indicator */}
                      <HStack className="items-center gap-1.5 ml-2">
                        {actionType === "phone" ? (
                          <Box
                            style={{
                              backgroundColor: "rgba(139, 195, 74, 0.15)",
                              padding: 7,
                              borderRadius: 8,
                            }}
                          >
                            <Ionicons name="call" size={15} color="#8BC34A" />
                          </Box>
                        ) : actionType === "email" ? (
                          <Box
                            style={{
                              backgroundColor: "rgba(139, 195, 74, 0.15)",
                              padding: 7,
                              borderRadius: 8,
                            }}
                          >
                            <Ionicons name="mail" size={15} color="#8BC34A" />
                          </Box>
                        ) : (
                          <Ionicons
                            name="link"
                            size={20}
                            color="#8BC34A"
                          />
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                </Pressable>
              );
            })}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Open With Modal for Email */}
      <Modal
        animationType="slide"
        transparent
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
        statusBarTranslucent
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            justifyContent: "flex-end",
          }}
          onPress={() => setEmailModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: isDark ? "#1A1A1E" : "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 34,
              borderTopWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Indicator */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#4B5563" : "#D1D5DB",
                alignSelf: "center",
                marginBottom: 16,
              }}
            />

            {/* Modal Header */}
            <HStack className="items-center justify-between mb-4">
              <VStack>
                <ThemedText
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                  }}
                >
                  Open with
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 13,
                    color: isDark ? "#94A3B8" : "#64748B",
                    marginTop: 2,
                  }}
                >
                  Select an option to contact {selectedBank?.name || "Support"}
                </ThemedText>
              </VStack>

              <Pressable
                onPress={() => setEmailModalVisible(false)}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? "#27272A" : "#F1F5F9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={isDark ? "#A1A1AA" : "#64748B"}
                />
              </Pressable>
            </HStack>

            {/* Recipient Information Card */}
            {selectedBank && (
              <Box
                style={{
                  backgroundColor: isDark
                    ? "rgba(139, 195, 74, 0.1)"
                    : "rgba(139, 195, 74, 0.08)",
                  borderColor: isDark
                    ? "rgba(139, 195, 74, 0.3)"
                    : "rgba(139, 195, 74, 0.4)",
                  borderWidth: 1,
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <HStack className="items-center justify-between">
                  <HStack className="items-center gap-3" style={{ flex: 1 }}>
                    <Image
                      source={selectedBank.img}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                    <VStack style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: isDark ? "#FFFFFF" : "#0F172A",
                        }}
                      >
                        {selectedBank.name} Support
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 12,
                          color: "#8BC34A",
                          fontWeight: "500",
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {selectedBank.url}
                      </ThemedText>
                    </VStack>
                  </HStack>

                  <Pressable
                    onPress={async () => {
                      try {
                        await Share.share({
                          message: selectedBank.url,
                          title: `${selectedBank.name} Support Email`,
                        });
                      } catch (err) {
                        console.error("Share error:", err);
                      }
                    }}
                    hitSlop={6}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.04)",
                    }}
                  >
                    <Ionicons
                      name="share-outline"
                      size={18}
                      color={isDark ? "#D1D5DB" : "#4B5563"}
                    />
                  </Pressable>
                </HStack>
              </Box>
            )}

            {/* Options List */}
            <VStack className="gap-2.5">
              {mailOptions.map((opt) => (
                <Pressable
                  key={opt.id}
                  onPress={opt.onPress}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Box
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.03)",
                      borderWidth: 1,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.07)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  >
                    <HStack className="items-center gap-3.5" style={{ flex: 1 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: opt.iconBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={20}
                          color={opt.iconColor}
                        />
                      </View>

                      <VStack style={{ flex: 1 }}>
                        <ThemedText
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: isDark ? "#FFFFFF" : "#0F172A",
                          }}
                        >
                          {opt.name}
                        </ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: isDark ? "#94A3B8" : "#64748B",
                            marginTop: 1,
                          }}
                        >
                          {opt.description}
                        </ThemedText>
                      </VStack>
                    </HStack>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                  </Box>
                </Pressable>
              ))}
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  bankRow: {
    padding: 14,
    borderRadius: 12,
  },

  logo: {
    width: 45,
    height: 45,
  },
});

