import React from "react";
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import { Box } from "@/components/box";
import { ThemedText } from "@/components/themed-text";

import { Ionicons } from "@expo/vector-icons";
import Watermark from "@/components/watermark";
import { ThemedView } from "@/components/themed-view";

export default function BookGameScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bankDetails = [
    {
      name: "ICICI Bank",
      website: "www.golftripz.com",
      img: require("../../../../../../assets/images/bankImages/ICICI_Bank_Logo.svg.png"),
      url: "https://teetimes.golftripz.com/",
    },
    {
      name: "SBI",
      website: "www.thriwe.com",
      img: require("../../../../../../assets/images/bankImages/sbi-img.png"),
      url: "https://teepassindia.thriwe.com/",
    },
    {
      name: "IndusInd Bank",
      website: "www.apexlynx.net",
      img: require("../../../../../../assets/images/bankImages/IndusInd-Bank.jpg"),
      url: "https://indusindgolf.apexlynx.net/",
    },
    {
      name: "HSBC",
      website: "www.thriwe.com",
      img: require("../../../../../../assets/images/bankImages/HSBC_logo_(2018).svg.png"),
      url: "https://golfpass.thriwe.com/login",
    },
    {
      name: "HDFC Bank",
      website: "www.hdfcbank.com",
      img: require("../../../../../../assets/images/bankImages/hdfc-img.jpg"),
      url: "https://www.hdfc.bank.in/",
    },
    {
      name: "American Express",
      website: "www.americanexpress.com",
      img: require("../../../../../../assets/images/bankImages/American-Express.png"),
      url: "https://www.americanexpress.com/en-in/",
    },
    {
      name: "Axis Bank",
      website: "www.extraordinaryweekends.com",
      img: require("../../../../../../assets/images/bankImages/axis-bank.png"),
      url: "https://www.extraordinaryweekends.com/",
    },
    {
      name: "Standard Chartered",
      website: "www.scb.golflan.com",
      img: require("../../../../../../assets/images/bankImages/standard-chartered-bank.png"),
      url: "https://scb.golflan.com/",
    },
    {
      name: "IDFC First Bank",
      website: "www.idfcfirst.truztee.com",
      img: require("../../../../../../assets/images/bankImages/idfc-first-bank-logo.png"),
      url: "https://idfcfirst.truztee.com/Account/Login",
    },
  ];

  return (
    <ThemedView
      style={{
        flex: 1,
      }}
    >
      <Watermark />

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className="px-4 pt-6 pb-20">
          {/* Header */}
          <VStack className="mb-6">
            <ThemedText
              style={{
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              Book a Complimentary Game
            </ThemedText>

            <ThemedText
              style={{
                fontSize: 14,
                opacity: 0.6,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Select your bank to be redirected to the booking portal.
            </ThemedText>
          </VStack>

          {/* Bank List */}
          <VStack className="gap-3">
            {bankDetails.map((bank, index) => (
              <Pressable key={index} onPress={() => Linking.openURL(bank.url)}>
                <Box
                  style={{
                    ...styles.bankRow,
                    // backgroundColor: isDark ? "#111" : "#fff",
                    borderColor: "#8bc34a",
                    borderWidth: 1,
                    borderRadius: 9,
                  }}
                >
                  <HStack className="items-center justify-between">
                    {/* Left Section */}
                    <HStack className="items-center flex gap-5">
                      <Image
                        source={bank.img}
                        style={styles.logo}
                        resizeMode="contain"
                      />

                      <VStack className="ml-3">
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
                        >
                          {bank.website}
                        </ThemedText>
                      </VStack>
                    </HStack>

                    {/* Chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={isDark ? "#aaa" : "#777"}
                    />
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </VStack>
      </ScrollView>
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
