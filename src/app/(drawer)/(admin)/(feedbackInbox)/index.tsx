import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { Box } from "@/components/box";
import { VStack } from "@/components/vstack";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import Watermark from "@/components/watermark";
//               onPress={() => routePage.push("/newRound/scoreCard")}
//     const routePage = useRouter();

import { HStack } from "@/components/hstack";
import { useRouter } from "expo-router";
import { Modal, Pressable, useColorScheme, View } from "react-native";

import { Divider } from "@/components/divider";
import { Text } from "@/components/text";
import { TextInput } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FeedbackInboxPage() {
  const router = useRouter();

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
        }}
      >
        <SafeAreaView
          style={{
            flex: 1,
          }}
        >
          <Watermark />

          <VStack className="flex-1 p-4">
            {/* HEADER (FIXED) */}
            <HStack className="items-center justify-between mb-4">
              <Pressable onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#8bc34a" />
              </Pressable>

              <ThemedText style={{ fontSize: 20, fontWeight: "700" }}>
                Feedback Inbox{" "}
              </ThemedText>

              <View style={{ width: 24 }} />
            </HStack>

            <Watermark />

            {/* CONTENT */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === "players" ? (
                <VStack>
                  {players.map((player) => (
                    <Pressable
                      key={player.id}
                      className="p-4 rounded-2xl mb-3"
                      style={{
                        // backgroundColor: isDark
                        //   ? "rgba(30,30,30,0.75)"
                        //   : "rgba(255,255,255,0.75)",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <HStack className="justify-between items-center">
                        <HStack className="items-center gap-3">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: "rgba(139,195,74,0.15)",
                            }}
                          >
                            <Ionicons
                              name="person-outline"
                              size={16}
                              color="#8bc34a"
                            />
                          </View>

                          <VStack>
                            <ThemedText
                              style={{ fontWeight: "700", fontSize: 16 }}
                            >
                              {player.name}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 12, color: "#666" }}>
                              {player.handicap}
                            </ThemedText>
                          </VStack>
                        </HStack>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#999"
                        />
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
              ) : (
                <VStack>
                  {teams.map((team) => (
                    <Pressable
                      key={team.id}
                      className="p-4 rounded-2xl mb-3"
                      style={{
                        // backgroundColor: isDark
                        //   ? "rgba(30,30,30,0.75)"
                        //   : "rgba(255,255,255,0.75)",
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <HStack className="justify-between items-center">
                        <HStack className="items-center gap-3">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: "rgba(139,195,74,0.15)",
                            }}
                          >
                            <Ionicons
                              name="people-outline"
                              size={16}
                              color="#8bc34a"
                            />
                          </View>

                          <VStack>
                            <ThemedText
                              style={{ fontWeight: "700", fontSize: 16 }}
                            >
                              {team.name}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 12, color: "#666" }}>
                              {team.players.join(", ")}
                            </ThemedText>
                          </VStack>
                        </HStack>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#999"
                        />
                      </HStack>
                    </Pressable>
                  ))}
                </VStack>
              )}
            </ScrollView>
          </VStack>
        </SafeAreaView>
      </ThemedView>
    </>
  );
}
