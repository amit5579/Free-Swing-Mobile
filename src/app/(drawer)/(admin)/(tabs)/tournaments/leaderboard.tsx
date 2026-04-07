import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";

import {
  getLeaderboard,
  getTeeboxDetails,
  postSecretHoles,
} from "@/api/admin/tournaments";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { Text } from "@/components/text";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LeaderboardPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeboxId, scoringType } =
    useLocalSearchParams();

  const isDoublePreoria =
    scoringType === "double-peoria" ||
    scoringType === "double-peoria-net" ||
    scoringType === "double-peoria-stableford";
  // "stableford" "double-peoria-net"  "excluded" "double-peoria-stableford"  "standard" "double-peoria"

  const [selectedFront, setSelectedFront] = useState<number[]>([]);
  const [selectedBack, setSelectedBack] = useState<number[]>([]);

  const [disabledSubmit, setDisabledSubmit] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const saved = await AsyncStorage.getItem("selectedHoles");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedFront(parsed.front || []);
        setSelectedBack(parsed.back || []);
        // console.log("ppp",parsed);
        setDisabledSubmit(false);
      }
    };

    loadData();

    AsyncStorage.setItem(
      "selectedHoles",
      JSON.stringify({ front: selectedFront, back: selectedBack }),
    );
    fetchData();
  }, []);

  const onSubmit = async () => {
    try {
      // const secretHoles = holes.filter((hole: any) => hole.isSelected).map((hole: any) => hole.holeNumber);
      const allSelectedHoles = [...selectedFront, ...selectedBack];
      await postSecretHoles(Number(tournamentId), allSelectedHoles)
      // console.log("selectedHoles", allSelectedHoles);
      Toast.show({
        type: "success",
        text1: "Double Peoria Handicap calculated successfully",
      });
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error calculating Double Peoria Handicap",
      });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const lb = await getLeaderboard(Number(tournamentId));
      const teebox = await getTeeboxDetails(Number(teeboxId));

      setLeaderboard(lb);
      setHoles(teebox);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const RenderHeader = () => {
    return (
      <HStack
        className="px-3 pt-5 pb-3 items-center"
        style={{ justifyContent: "space-between" }}
      >
        {/* LEFT: Back button */}
        <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={colorScheme === "dark" ? "#ffffff" : "#020617"}
          />
        </Pressable>

        {/* CENTER: Title */}
        <HStack
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 20,
              fontWeight: "700",
            }}
          >
            Leaderboard:
          </ThemedText>

          {loading ? (
            <Skeleton
              isDark={isDark}
              height={18}
              width={120}
              style={{ marginLeft: 8 }}
            />
          ) : (
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                marginLeft: 6,
              }}
            >
              {tournamentName}
            </ThemedText>
          )}
        </HStack>

        {/* RIGHT: Add Button */}
        <View style={{ width: 40 }} />
      </HStack>
    );
  };

  const RenderSecretHoles = () => {
    const isDark = colorScheme === "dark";

    if (!holes || holes.length === 0) return null;
   
    const border = isDark ? "#334155" : "#d1d5db";

    const secondaryText = isDark ? "#94a3b8" : "#6b7280";

    const HoleBox = ({ number, par }: { number: any; par: any }) => {
      const isSelected =
        number <= 9
          ? selectedFront.includes(number)
          : selectedBack.includes(number);

          const isDisabled =
  (number <= 9 && selectedFront.length >= 6 && !selectedFront.includes(number)) ||
  (number > 9 && selectedBack.length >= 6 && !selectedBack.includes(number));

      return (
        <Pressable
        disabled={isDisabled}
          onPress={() => {
            const isFront = number <= 9;

            if (isFront) {
              if (selectedFront.includes(number)) {
                // remove
                setSelectedFront((prev) => prev.filter((h) => h !== number));
              } else {
                if (selectedFront.length >= 6) {
                  Toast.show({
                    type: "error",
                    text1: "You can select only 6 front holes",
                  });
                  return;
                }
                setSelectedFront((prev) => [...prev, number]);
              }
            } else {
              if (selectedBack.includes(number)) {
                setSelectedBack((prev) => prev.filter((h) => h !== number));
              } else {
                if (selectedBack.length >= 6) {
                  Toast.show({
                    type: "error",
                    text1: "You can select only 6 back holes",
                  });
                  return;
                }
                setSelectedBack((prev) => [...prev, number]);
              }
            }
          }}
          style={{
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: border,

    backgroundColor: isSelected
      ? "#8bc34a"
      : isDisabled
        ? isDark
          ? "rgba(100, 116, 139, 0.3)"
          : "rgba(203, 213, 225, 0.5)"
        : isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",

    opacity: isDisabled ? 0.5 : 1,

    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  }}
        >
          <ThemedText
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: isDark ? "#f1f5f9" : "#020617",
            }}
          >
            {number}
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 10,
              color: secondaryText,
            }}
          >
            Par {par}
          </ThemedText>
        </Pressable>
      );
    };

    const frontNine = holes.slice(0, 9);
    const backNine = holes.slice(9, 18);

   

    return (
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {/* HEADER */}
        <ThemedText
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: isDark ? "#f1f5f9" : "#020617",
            marginBottom: 6,
          }}
        >
          Double Peoria: Secret Hole Selection
        </ThemedText>

        <ThemedText
          style={{
            fontSize: 12,
            color: secondaryText,
            marginBottom: 14,
          }}
        >
          Select exactly 6 holes from Front (1-9) and 6 from Back (10-18).
        </ThemedText>

        {/* FRONT NINE */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isDark ? "#f1f5f9" : "#020617",
            marginBottom: 8,
          }}
        >
          Front Nine (1-9)
        </ThemedText>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {frontNine.map((item: any, index: any) => (
            <HoleBox key={index} number={item.holeNumber} par={item.par} />
          ))}
        </View>

        {/* BACK NINE */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isDark ? "#f1f5f9" : "#020617",
            marginTop: 14,
            marginBottom: 8,
          }}
        >
          Back Nine (10-18)
        </ThemedText>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {backNine.map((item: any, index: any) => (
            <HoleBox key={index} number={item.holeNumber} par={item.par} />
          ))}
        </View>

        {/* FOOTER */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            justifyContent: "space-between",
          }}
        >
          {/* Button */}
          <Pressable
            onPress={() =>
               {
                const allSelectedHoles = [...selectedFront, ...selectedBack];
                const lessHoles = allSelectedHoles.length !== 12;
                if(lessHoles){
                  setDisabledSubmit(true);
                  Toast.show({
                    type: "error",
                    text1: "Please select 6 holes from front and 6 holes from back",
                  });
                  return;
                }
                else{
                  setDisabledSubmit(false);
                }
              onSubmit()}}
              disabled = {disabledSubmit}
            style={{
              backgroundColor: disabledSubmit ? "#aad37bff" : "#8bc34a",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              Calculate Double Peoria
            </Text>
          </Pressable>

          {/* Selected text */}
          <ThemedText
            style={{
              fontSize: 13,
              fontWeight: "500",
            }}
          >
            Selected:
            <ThemedText
              style={{
                fontSize: 13,
                color: "#ef4444",
                fontWeight: "500",
              }}
            >
              {selectedFront.length}/6 Front | {selectedBack.length}/6 Back{" "}
            </ThemedText>
          </ThemedText>
        </View>
      </View>
    );
  };

  const LeaderboardCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    return (
      <View
        style={{
          borderWidth: 1,
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          borderColor: isDark ? "#333" : "#ddd",
        }}
      >
        {/* HEADER */}
        <HStack style={{ alignItems: "center" }}>
          <Skeleton isDark={isDark} height={30} width={30} borderRadius={15} />

          <VStack style={{ flex: 1, marginLeft: 10 }}>
            <Skeleton isDark={isDark} height={14} width="60%" />
            <Skeleton
              isDark={isDark}
              height={10}
              width="40%"
              style={{ marginTop: 4 }}
            />
          </VStack>

          <VStack>
            <Skeleton isDark={isDark} height={14} width={30} />
            <Skeleton
              isDark={isDark}
              height={10}
              width={20}
              style={{ marginTop: 4 }}
            />
          </VStack>
        </HStack>

        {/* GRID (18 holes feel) */}
        <View style={{ marginTop: 10 }}>
          {[1, 2].map((row) => (
            <HStack key={row} style={{ marginBottom: 8 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton
                  key={i}
                  isDark={isDark}
                  height={28}
                  width={28}
                  borderRadius={14}
                  style={{ marginRight: 6 }}
                />
              ))}
            </HStack>
          ))}
        </View>

        {/* SUMMARY */}
        <HStack style={{ marginTop: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={14}
              width="18%"
              style={{ marginRight: 6 }}
            />
          ))}
        </HStack>

        {/* EXTRA */}
        <HStack style={{ marginTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              isDark={isDark}
              height={14}
              width="30%"
              style={{ marginRight: 6 }}
            />
          ))}
        </HStack>
      </View>
    );
  };
  return (
    <>
      <ThemedView style={{ flex: 1 }}>
        <RenderHeader />
        <Watermark />

        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <LeaderboardCardSkeleton key={i} isDark={isDark} />
              ))}
            </>
          ) : (
            <>
              {isDoublePreoria && <RenderSecretHoles />}

              {leaderboard.map((player) => (
                <PlayerCard
                  key={player.userId}
                  player={player}
                  holes={holes}
                  isDark={isDark}
                />
              ))}
            </>
          )}
        </ScrollView>
      </ThemedView>
    </>
  );
}

function PlayerCard({ player, holes, isDark }: any) {
  return (
    <View style={[styles.card, { borderColor: isDark ? "#333" : "#ddd" }]}>
      {/* HEADER */}
      <HStack style={styles.header}>
        <View style={styles.rank}>
          <ThemedText style={{ fontWeight: "700" }}>
            {player.rank || "-"}
          </ThemedText>
        </View>

        <VStack style={{ flex: 1 }}>
          <ThemedText style={styles.name}>{player.playerName}</ThemedText>
          <ThemedText style={styles.sub}>HC: {player.handicap}</ThemedText>
        </VStack>

        <VStack style={{ alignItems: "flex-end" }}>
          <ThemedText style={styles.points}>{player.points}</ThemedText>
          <ThemedText style={styles.sub}>PTS</ThemedText>
        </VStack>
      </HStack>

      {/* HOLES GRID */}
      <View style={{ marginTop: 10 }}>
        {/* FRONT 9 */}
        <HStack style={styles.gridRow}>
          {Array.from({ length: 9 }).map((_, i) => {
            const holeNum = i + 1;
            const score = player.holeScores?.[holeNum];

            return (
              <View key={holeNum} style={styles.gridCell}>
                <ThemedText style={styles.holeNumber}>{holeNum}</ThemedText>
                <View
                  style={[
                    styles.scoreCircle,
                    getScoreStyle(score, holes[i]?.par),
                  ]}
                >
                  <ThemedText>{score ?? "-"}</ThemedText>
                </View>
                <ThemedText>{holes[i]?.par}</ThemedText>
              </View>
            );
          })}
        </HStack>

        {/* BACK 9 */}
        <HStack style={styles.gridRow}>
          {Array.from({ length: 9 }).map((_, i) => {
            const holeNum = i + 10;
            const score = player.holeScores?.[holeNum];

            return (
              <View key={holeNum} style={styles.gridCell}>
                <ThemedText style={styles.holeNumber}>{holeNum}</ThemedText>
                <View
                  style={[
                    styles.scoreCircle,
                    getScoreStyle(score, holes[i + 9]?.par),
                  ]}
                >
                  <ThemedText>{score ?? "-"}</ThemedText>
                </View>
                <ThemedText>{holes[i + 9]?.par}</ThemedText>
              </View>
            );
          })}
        </HStack>
      </View>

      {/* STATS */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 12,
          rowGap: 12,
        }}
      >
        {[
          { label: "OUT", value: player.front9 },
          { label: "IN", value: player.back9 },
          { label: "GROSS", value: player.gross },
          { label: "NET", value: player.net },
          { label: "PTS", value: player.points },
          { label: "Birdies", value: player.birdies },
          { label: "Pars", value: player.pars },
          { label: "Eagles", value: player.eagles },
        ]
          .filter((s) => s.value !== undefined && s.value !== null)
          .map((stat, idx) => (
            <Stat key={idx} label={stat.label} value={stat.value} />
          ))}
      </View>
    </View>
  );
}

function Stat({ label, value }: any) {
  return (
    <VStack style={styles.stat}>
      <ThemedText style={styles.statValue}>{value ?? "-"}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </VStack>
  );
}

function getScoreStyle(score: number, par: number): ViewStyle {
  if (!score || !par) return {};

  const diff = score - par;

  if (diff <= -2) return { borderColor: "#166534", borderWidth: 2 }; // eagle
  if (diff === -1) return { borderColor: "#16a34a", borderWidth: 2 }; // birdie
  if (diff === 0)
    return { borderColor: "#9ca3af", borderStyle: "dashed", borderWidth: 1 };
  if (diff === 1) return { borderColor: "#ef4444", borderWidth: 2 };
  if (diff >= 2) return { borderColor: "#dc2626", borderWidth: 2 };

  return {};
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },

  header: {
    alignItems: "center",
  },

  rank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#84cc16",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  sub: {
    fontSize: 12,
    opacity: 0.6,
  },

  points: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16a34a",
  },

  holeCell: {
    alignItems: "center",
    marginRight: 10,
  },

  holeNumber: {
    fontSize: 11,
    opacity: 0.6,
  },

  scoreCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginTop: 4,
  },

  summary: {
    marginTop: 12,
    justifyContent: "space-between",
  },

  stat: {
    alignItems: "center",
    minWidth: "18%",
  },

  statValue: {
    fontWeight: "700",
  },

  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 8,
  },

  gridCell: {
    alignItems: "center",
    flex: 1,
  },
});
