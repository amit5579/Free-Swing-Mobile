import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
  InteractionManager,
  BackHandler,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import { HStack } from "@/components/hstack";
import Watermark from "@/components/watermark";
import { Alert } from "react-native";

import {
  getLeaderboard,
  getTeeboxDetails,
  authenticateScores,
} from "@/api/modules/admin/tournaments.api";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "@/components/Skeleton";
import { Box } from "@/components/box";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions } from "react-native";

export default function LeaderboardUser() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const routePage = useRouter();

  const { tournamentId, tournamentName, teeboxId, scoringType } =
    useLocalSearchParams();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [holes, setHoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedPlayerAction, setSelectedPlayerAction] = useState<any | null>(null);

  // Rotate leaderboard + header
  const [isCardRotated, setIsCardRotated] = useState(false);
  const windowDims = Dimensions.get("window");
  const [containerDimensions, setContainerDimensions] = useState({
    width: windowDims.width,
    height: windowDims.height,
  });

  const isMountedRef = useRef(true);
  const teeboxLoadedRef = useRef(false);
  const horizontalScrollRef = useRef<ScrollView | null>(null);
  const scrollXRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const leaderboardRef = useRef(leaderboard);
  leaderboardRef.current = leaderboard;

  // Reset scroll offset when switching tournaments or teeboxes
  useEffect(() => {
    scrollXRef.current = 0;
  }, [tournamentId, teeboxId]);

  // Restore horizontal scroll offset on background leaderboard data updates
  useEffect(() => {
    if (
      scrollXRef.current > 0 &&
      horizontalScrollRef.current &&
      !isDraggingRef.current
    ) {
      const rafId = requestAnimationFrame(() => {
        if (!isDraggingRef.current) {
          horizontalScrollRef.current?.scrollTo({
            x: scrollXRef.current,
            animated: false,
          });
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [leaderboard]);

  // Toggle card rotation
  const toggleOrientation = useCallback(() => {
    setIsCardRotated((prev) => !prev);
  }, []);

  const handleBack = useCallback(() => {
    if (isCardRotated) {
      setIsCardRotated(false);
      return;
    }
    if (routePage.canGoBack()) {
      routePage.back();
    } else {
      routePage.replace("/(drawer)/(user)/(tabs)/tournaments");
    }
  }, [isCardRotated, routePage]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => {
        sub.remove();
      };
    }, [handleBack]),
  );

  useEffect(() => {
    isMountedRef.current = true;
    const initUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id && isMountedRef.current) setCurrentUserId(Number(id));
    };
    initUserId();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getScoringLabel = (scoringType: string) => {
    switch (scoringType) {
      case "double-peoria-stableford":
        return "Double Peoria Stableford";
      case "double-peoria":
        return "Double Peoria Net";
      case "double-peoria-net":
        return "Double Peoria Net";
      case "stableford":
        return "Stableford";
      case "excluded":
        return "Practice Round";
      case "system-36":
        return "System 36";
      default:
        return "Gross / Net";
    }
  };

  const getFront9 = (holes: any[]) => {
    return holes.filter((hole) => hole.holeNumber <= 9);
  };

  const getBack9 = (holes: any[]) => {
    return holes.filter((hole) => hole.holeNumber > 9);
  };

  const getTotalPar = (holes: any[]) => {
    return holes.reduce((total, hole) => total + hole.par, 0);
  };

  const fetchData = useCallback(
    async (showSkeleton = false) => {
      if (!tournamentId) return;
      try {
        if (showSkeleton && !leaderboardRef.current.length) setLoading(true);

        const lbPromise = getLeaderboard(Number(tournamentId));
        const teeboxPromise =
          !teeboxLoadedRef.current && teeboxId
            ? getTeeboxDetails(Number(teeboxId))
            : Promise.resolve(null);

        const [lb, teebox] = await Promise.all([lbPromise, teeboxPromise]);

        if (isMountedRef.current) {
          if (Array.isArray(lb)) {
            setLeaderboard(lb);
          }
          if (teebox && Array.isArray(teebox)) {
            setHoles(teebox);
            teeboxLoadedRef.current = true;
          }
        }
      } catch (err) {
        console.warn("Leaderboard fetch error:", err);
      } finally {
        if (showSkeleton && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [tournamentId, teeboxId],
  );

  useFocusEffect(
    useCallback(() => {
      let intervalId: ReturnType<typeof setInterval>;
      fetchData(true);
      intervalId = setInterval(() => {
        fetchData(false);
      }, 5000);

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, [fetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error("Error refreshing", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAuthenticate = async (player: any) => {
    try {
      if (!player.scorecardId) return;
      await authenticateScores(player.scorecardId);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Player authenticated successfully",
      });
      // Update local state to show verified
      setLeaderboard((prev) =>
        prev.map((item) =>
          item.scorecardId === player.scorecardId
            ? { ...item, isAuthenticated: true }
            : item,
        ),
      );
    } catch (error) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to authenticate player",
      });
    }
  };

  const renderHeader = () => {
    return (
      <Box
        style={{
          backgroundColor: isDark ? "#161618" : "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb",
        }}
      >
        <VStack
          style={{
            paddingHorizontal: 16,
            paddingTop: isCardRotated
              ? 10
              : Platform.OS === "android"
                ? (StatusBar.currentHeight ?? 0) + 8
                : 14,
            paddingBottom: 12,
          }}
        >
          {/* 🔝 TOP ROW */}
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* 🔙 BACK */}
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(139,195,74,0.15)" : "#f1f5f9",
              }}
            >
              <Ionicons name="arrow-back" size={20} color="#8BC34A" />
            </TouchableOpacity>

            {/* 🧠 TITLE BLOCK */}
            <VStack
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 6,
              }}
            >
              {/* LABEL */}
              <ThemedText
                style={{
                  fontSize: 12,
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: "500",
                }}
              >
                Leaderboard
              </ThemedText>

              {/* MAIN TITLE */}
              {loading ? (
                <Skeleton
                  isDark={isDark}
                  height={18}
                  width={140}
                  style={{ marginTop: 2, borderRadius: 6 }}
                />
              ) : (
                <ThemedText
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    marginTop: 2,
                    maxWidth: "85%",
                    textAlign: "center",
                    color: isDark ? "#fff" : "#020617",
                  }}
                >
                  {tournamentName}
                </ThemedText>
              )}
            </VStack>

            {/* 🔄 ROTATE DISPLAY BUTTON */}
            <TouchableOpacity
              onPress={toggleOrientation}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isCardRotated
                  ? "#8BC34A"
                  : isDark
                    ? "rgba(139,195,74,0.15)"
                    : "#f1f5f9",
                borderWidth: 1,
                borderColor: isCardRotated
                  ? "#7cb342"
                  : isDark
                    ? "rgba(139,195,74,0.3)"
                    : "rgba(139,195,74,0.2)",
              }}
            >
              <Ionicons
                name={
                  isCardRotated
                    ? "phone-portrait-outline"
                    : "phone-landscape-outline"
                }
                size={20}
                color={isCardRotated ? "#ffffff" : "#8BC34A"}
              />
            </TouchableOpacity>
          </HStack>
        </VStack>
      </Box>
    );
  };

  const renderStatsSection = () => {
    const isDark = colorScheme === "dark";

    return (
      <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
        {/* Top Info Bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          {/* Left info: player count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "#f1f5f9",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Ionicons
              name="people-outline"
              size={13}
              color={isDark ? "#94a3b8" : "#64748b"}
            />
            <ThemedText
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: isDark ? "#cbd5e1" : "#475569",
              }}
            >
              {leaderboard.length}{" "}
              {leaderboard.length === 1 ? "Player" : "Players"}
            </ThemedText>
          </View>

          {/* Right Badge: Scoring Type */}
          <View
            style={{
              backgroundColor: isDark ? "#1e40af" : "#e0f2fe",
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: isDark ? "#93c5fd" : "#0369a1",
              }}
            >
              {getScoringLabel(scoringType as string)}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const RANK_WIDTH = 30;
  const PLAYER_WIDTH = 80;
  const HCP_WIDTH = 40;
  const SHCP_WIDTH = 42;
  const HOLE_WIDTH = 32; // Holes 1..18
  const TOTAL_WIDTH = 40; // OUT, IN
  const STAT_WIDTH = 46; // GROSS, NET, PTS
  const MINI_STAT_WIDTH = 38; // EGL, BRD, PAR

  const isSystem36 = scoringType === "system-36";
  const showNetColumn = !isSystem36;

  const leftFixedWidth = useMemo(() => {
    return (
      RANK_WIDTH +
      PLAYER_WIDTH +
      HCP_WIDTH +
      (isSystem36 ? SHCP_WIDTH : 0)
    );
  }, [isSystem36]);

  const rightContentWidth = useMemo(() => {
    const front9 = HOLE_WIDTH * 9 + TOTAL_WIDTH; // 1..9 + OUT (328px)
    const back9 = HOLE_WIDTH * 9 + TOTAL_WIDTH; // 10..18 + IN (328px)
    const totals = STAT_WIDTH * (showNetColumn ? 3 : 2); // GROSS, NET (opt), PTS (138px or 92px)
    const endStats = MINI_STAT_WIDTH * 3; // EGL, BRD, PAR (114px)
    return front9 + back9 + totals + endStats;
  }, [showNetColumn]);

  const renderTableHeaderLeft = () => (
    <HStack
      style={{
        height: 45,
        width: leftFixedWidth,
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(139, 195, 74, 0.15)",
        borderRightWidth: 1,
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.08)",
        alignItems: "center",
      }}
    >
      <ThemedText style={[styles.headerText, { width: RANK_WIDTH, fontSize: 10.5 }]}>
        RNK
      </ThemedText>
      <ThemedText
        numberOfLines={1}
        style={[
          styles.headerText,
          { width: PLAYER_WIDTH, textAlign: "left", paddingLeft: 6, fontSize: 10.5 },
        ]}
      >
        PLAYER
      </ThemedText>
      <ThemedText
        style={[styles.headerText, { width: HCP_WIDTH, fontSize: 10.5 }]}
      >
        HCP
      </ThemedText>
      {isSystem36 && (
        <ThemedText
          style={[
            styles.headerText,
            { width: SHCP_WIDTH, fontSize: 10.5, color: "#f59e0b" },
          ]}
        >
          SHCP
        </ThemedText>
      )}
    </HStack>
  );

  const renderTableHeaderRight = () => (
    <HStack
      style={{
        height: 45,
        width: rightContentWidth,
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(139, 195, 74, 0.15)",
        alignItems: "center",
      }}
    >
      {/* 1. Front 9 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText key={i} style={[styles.headerText, { width: HOLE_WIDTH }]}>
          {i + 1}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        OUT
      </ThemedText>

      {/* 2. Back 9 */}
      {Array.from({ length: 9 }).map((_, i) => (
        <ThemedText
          key={i + 9}
          style={[styles.headerText, { width: HOLE_WIDTH }]}
        >
          {i + 10}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.headerText, { width: TOTAL_WIDTH, fontWeight: "800" }]}
      >
        IN
      </ThemedText>

      {/* 3. Totals */}
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800", color: "#84cc16" }]}
      >
        GROSS
      </ThemedText>
      {showNetColumn && (
        <ThemedText
          style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800", color: "#3b82f6" }]}
        >
          NET
        </ThemedText>
      )}
      <ThemedText
        style={[styles.headerText, { width: STAT_WIDTH, fontWeight: "800", color: "#16a34a" }]}
      >
        PTS
      </ThemedText>

      {/* 4. Stat columns */}
      <ThemedText style={[styles.headerText, { width: MINI_STAT_WIDTH }]}>
        EGL
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: MINI_STAT_WIDTH }]}>
        BRD
      </ThemedText>
      <ThemedText style={[styles.headerText, { width: MINI_STAT_WIDTH }]}>
        PAR
      </ThemedText>
    </HStack>
  );

  const renderInfoRowLeft = (
    label: string,
    data?: any[],
    type?: "par" | "si",
  ) => (
    <HStack
      style={{
        height: 40,
        width: leftFixedWidth,
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.06)",
        borderRightWidth: 1,
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
      }}
    >
      <View style={{ width: RANK_WIDTH }} />
      <ThemedText
        numberOfLines={2}
        style={[styles.infoLabel, { width: PLAYER_WIDTH, paddingLeft: 6, fontSize: 9.5 }]}
      >
        {label}
      </ThemedText>
      <ThemedText
        style={[styles.infoCellText, { width: HCP_WIDTH }]}
      >
        -
      </ThemedText>
      {isSystem36 && (
        <ThemedText
          style={[styles.infoCellText, { width: SHCP_WIDTH }]}
        >
          -
        </ThemedText>
      )}
    </HStack>
  );

  const renderInfoRowRight = (
    data: any[],
    type: "par" | "si",
  ) => (
    <HStack
      style={{
        height: 40,
        width: rightContentWidth,
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.06)",
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* 1. Front 9 */}
      {data.slice(0, 9).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.strokeIndex}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par"
          ? data.slice(0, 9).reduce((s, h) => s + (h.par || 0), 0)
          : "-"}
      </ThemedText>

      {/* 2. Back 9 */}
      {data.slice(9, 18).map((h, i) => (
        <ThemedText
          key={i}
          style={[styles.infoCellText, { width: HOLE_WIDTH }]}
        >
          {type === "par" ? h.par : h.strokeIndex}
        </ThemedText>
      ))}
      <ThemedText
        style={[styles.infoCellText, { width: TOTAL_WIDTH, fontWeight: "700" }]}
      >
        {type === "par"
          ? data.slice(9, 18).reduce((s, h) => s + (h.par || 0), 0)
          : "-"}
      </ThemedText>

      {/* 3. Totals (GROSS course par, NET -, PTS -) */}
      <ThemedText
        style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
      >
        {type === "par" && data ? data.reduce((s, h) => s + (h.par || 0), 0) : "-"}
      </ThemedText>
      {showNetColumn && (
        <ThemedText
          style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
        >
          -
        </ThemedText>
      )}
      <ThemedText
        style={[styles.infoCellText, { width: STAT_WIDTH, fontWeight: "700" }]}
      >
        -
      </ThemedText>

      {/* 4. Stat columns placeholder */}
      <ThemedText style={[styles.infoCellText, { width: MINI_STAT_WIDTH }]}>
        -
      </ThemedText>
      <ThemedText style={[styles.infoCellText, { width: MINI_STAT_WIDTH }]}>
        -
      </ThemedText>
      <ThemedText style={[styles.infoCellText, { width: MINI_STAT_WIDTH }]}>
        -
      </ThemedText>
    </HStack>
  );

  const renderPlayerRowLeft = (player: any, index: number) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? "transparent"
      : isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)";

    return (
      <HStack
        style={{
          height: 50,
          width: leftFixedWidth,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.06)",
          borderRightWidth: 1,
          alignItems: "center",
        }}
      >
        <ThemedText
          style={[styles.cellText, { width: RANK_WIDTH, fontWeight: "700" }]}
        >
          {player.rank || "-"}
        </ThemedText>

        <Pressable
          onPress={() => setSelectedPlayerAction(player)}
          hitSlop={4}
          style={{
            width: PLAYER_WIDTH,
            paddingLeft: 6,
            paddingRight: 4,
            justifyContent: "center",
          }}
        >
          <HStack style={{ alignItems: "center", gap: 3 }}>
            <ThemedText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                flexShrink: 1,
              }}
            >
              {player.playerName}
            </ThemedText>
            {player.isAuthenticated && (
              <Ionicons
                name="checkmark-circle"
                size={12}
                color="#16a34a"
              />
            )}
          </HStack>
        </Pressable>

        <ThemedText
          style={[
            styles.cellText,
            { width: HCP_WIDTH, fontWeight: "600", fontSize: 12 },
          ]}
        >
          {player.handicap ?? "-"}
        </ThemedText>
        {isSystem36 && (
          <ThemedText
            style={[
              styles.cellText,
              {
                width: SHCP_WIDTH,
                fontWeight: "700",
                fontSize: 12,
                color: "#f59e0b",
              },
            ]}
          >
            {player.dpHandicap ?? "-"}
          </ThemedText>
        )}
      </HStack>
    );
  };

  const renderPlayerRowRight = (player: any, index: number) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? "transparent"
      : isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)";

    return (
      <HStack
        style={{
          height: 50,
          width: rightContentWidth,
          backgroundColor: rowBg,
          borderBottomWidth: 0.5,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.06)",
          alignItems: "center",
        }}
      >
        {/* 1. Front 9 */}
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 1];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.front9}
        </ThemedText>

        {/* 2. Back 9 */}
        {Array.from({ length: 9 }).map((_, i) => {
          const score = player.holeScores?.[i + 10];
          return (
            <View key={i} style={[styles.cell, { width: HOLE_WIDTH }]}>
              <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                {score ?? "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.cellText,
            { width: TOTAL_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.back9}
        </ThemedText>

        {/* 3. Totals */}
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#84cc16" },
          ]}
        >
          {player.gross}
        </ThemedText>
        {showNetColumn && (
          <ThemedText
            style={[
              styles.cellText,
              { width: STAT_WIDTH, fontWeight: "800", color: "#3b82f6" },
            ]}
          >
            {player.net}
          </ThemedText>
        )}
        <ThemedText
          style={[
            styles.cellText,
            { width: STAT_WIDTH, fontWeight: "800", color: "#16a34a" },
          ]}
        >
          {player.points}
        </ThemedText>

        {/* 4. Stat columns */}
        <ThemedText style={[styles.cellText, { width: MINI_STAT_WIDTH }]}>
          {player.eagles}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: MINI_STAT_WIDTH }]}>
          {player.birdies}
        </ThemedText>
        <ThemedText style={[styles.cellText, { width: MINI_STAT_WIDTH }]}>
          {player.pars}
        </ThemedText>
      </HStack>
    );
  };

  // Multi-row sub-rows for System 36 (Net scores row + Points row)
  const renderPlayerSubRowRight = (
    player: any,
    index: number,
    type: "net" | "points",
  ) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? "transparent"
      : isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)";

    const dataMap =
      type === "net" ? player.holeNetScores : player.holeStablefordPoints;
    const front9Total = type === "net" ? player.front9Net : player.front9Points;
    const back9Total = type === "net" ? player.back9Net : player.back9Points;
    const labelColor = type === "net" ? "#3b82f6" : "#16a34a";

    return (
      <HStack
        style={{
          height: 36,
          width: rightContentWidth,
          backgroundColor: rowBg,
          borderBottomWidth: type === "points" ? 1.5 : 0.5,
          borderColor:
            type === "points"
              ? isDark
                ? "rgba(139, 195, 74, 0.2)"
                : "rgba(139, 195, 74, 0.3)"
              : isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
          alignItems: "center",
        }}
      >
        {/* 1. Front 9 */}
        {Array.from({ length: 9 }).map((_, i) => {
          const val = dataMap?.[i + 1];
          return (
            <View
              key={i}
              style={[styles.cell, { width: HOLE_WIDTH, height: 36 }]}
            >
              <ThemedText
                style={{ fontSize: 12, fontWeight: "500", color: labelColor }}
              >
                {val != null ? val : "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.subCellText,
            { width: TOTAL_WIDTH, fontWeight: "700", color: labelColor },
          ]}
        >
          {front9Total != null ? front9Total : 0}
        </ThemedText>

        {/* 2. Back 9 */}
        {Array.from({ length: 9 }).map((_, i) => {
          const val = dataMap?.[i + 10];
          return (
            <View
              key={i}
              style={[styles.cell, { width: HOLE_WIDTH, height: 36 }]}
            >
              <ThemedText
                style={{ fontSize: 12, fontWeight: "500", color: labelColor }}
              >
                {val != null ? val : "-"}
              </ThemedText>
            </View>
          );
        })}
        <ThemedText
          style={[
            styles.subCellText,
            { width: TOTAL_WIDTH, fontWeight: "700", color: labelColor },
          ]}
        >
          {back9Total != null ? back9Total : 0}
        </ThemedText>

        {/* 3. Totals */}
        <ThemedText style={[styles.subCellText, { width: STAT_WIDTH }]}>
          -
        </ThemedText>
        {showNetColumn && (
          <ThemedText style={[styles.subCellText, { width: STAT_WIDTH }]}>
            {type === "net" ? (
              <ThemedText
                style={{ color: "#3b82f6", fontWeight: "800", fontSize: 12 }}
              >
                {player.net}
              </ThemedText>
            ) : (
              "-"
            )}
          </ThemedText>
        )}
        <ThemedText style={[styles.subCellText, { width: STAT_WIDTH }]}>
          {type === "points" ? (
            <ThemedText
              style={{ color: "#16a34a", fontWeight: "800", fontSize: 12 }}
            >
              {player.points != null ? player.points : 0}
            </ThemedText>
          ) : (
            "-"
          )}
        </ThemedText>

        {/* 4. Stat columns */}
        <ThemedText style={[styles.subCellText, { width: MINI_STAT_WIDTH }]}>
          -
        </ThemedText>
        <ThemedText style={[styles.subCellText, { width: MINI_STAT_WIDTH }]}>
          -
        </ThemedText>
        <ThemedText style={[styles.subCellText, { width: MINI_STAT_WIDTH }]}>
          -
        </ThemedText>
      </HStack>
    );
  };

  const renderPlayerSubRowLeft = (
    player: any,
    index: number,
    label: string,
  ) => {
    const isEven = index % 2 === 0;
    const rowBg = isEven
      ? "transparent"
      : isDark
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.02)";

    return (
      <HStack
        style={{
          height: 36,
          width: leftFixedWidth,
          backgroundColor: rowBg,
          borderBottomWidth: label === "Pts" ? 1.5 : 0.5,
          borderColor:
            label === "Pts"
              ? isDark
                ? "rgba(139, 195, 74, 0.2)"
                : "rgba(139, 195, 74, 0.3)"
              : isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.06)",
          borderRightWidth: 1,
          alignItems: "center",
        }}
      >
        <View style={{ width: RANK_WIDTH }} />
        <ThemedText
          style={{
            width: PLAYER_WIDTH,
            textAlign: "left",
            paddingLeft: 6,
            fontSize: 10,
            fontWeight: "700",
            color: label === "Net" ? "#3b82f6" : "#16a34a",
          }}
        >
          {label}
        </ThemedText>
        <ThemedText style={[styles.subCellText, { width: HCP_WIDTH }]}>
          -
        </ThemedText>
        {isSystem36 && (
          <ThemedText style={[styles.subCellText, { width: SHCP_WIDTH }]}>
            -
          </ThemedText>
        )}
      </HStack>
    );
  };

  const renderTableLoadingSkeleton = () => {
    const rows = 8;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View
          style={{
            marginHorizontal: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(139, 195, 74, 0.35)"
              : "rgba(139, 195, 74, 0.45)",
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
            overflow: "hidden",
          }}
        >
          <HStack>
            {/* Left fixed skeleton */}
            <VStack style={{ width: leftFixedWidth }}>
              <View
                style={{
                  height: 45,
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(139, 195, 74, 0.15)",
                  borderRightWidth: 1,
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                }}
              >
                <Skeleton isDark={isDark} height={12} width={70} />
              </View>
              {Array.from({ length: rows }).map((_, i) => (
                <HStack
                  key={i}
                  style={{
                    height: 50,
                    borderBottomWidth: 0.5,
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.06)",
                    borderRightWidth: 1,
                    paddingHorizontal: 4,
                    alignItems: "center",
                    backgroundColor:
                      i % 2 === 0
                        ? "transparent"
                        : isDark
                          ? "rgba(255, 255, 255, 0.03)"
                          : "rgba(0, 0, 0, 0.02)",
                  }}
                >
                  <View style={{ width: RANK_WIDTH, alignItems: "center" }}>
                    <Skeleton isDark={isDark} height={12} width={14} />
                  </View>
                  <View style={{ width: PLAYER_WIDTH, paddingHorizontal: 4 }}>
                    <Skeleton isDark={isDark} height={11} width={52} />
                  </View>
                  <View style={{ width: HCP_WIDTH, alignItems: "center" }}>
                    <Skeleton isDark={isDark} height={12} width={20} />
                  </View>
                  {isSystem36 && (
                    <View style={{ width: SHCP_WIDTH, alignItems: "center" }}>
                      <Skeleton isDark={isDark} height={12} width={20} />
                    </View>
                  )}
                </HStack>
              ))}
            </VStack>

            {/* Right scrollable skeleton */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <VStack style={{ width: rightContentWidth }}>
                <View
                  style={{
                    height: 45,
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(139, 195, 74, 0.15)",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                >
                  <Skeleton isDark={isDark} height={12} width={200} />
                </View>

                {Array.from({ length: rows }).map((_, r) => (
                  <HStack
                    key={r}
                    style={{
                      height: 50,
                      borderBottomWidth: 0.5,
                      borderColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                      backgroundColor:
                        r % 2 === 0
                          ? "transparent"
                          : isDark
                            ? "rgba(255, 255, 255, 0.03)"
                            : "rgba(0, 0, 0, 0.02)",
                      paddingHorizontal: 6,
                      alignItems: "center",
                    }}
                  >
                    {/* Holes 1..9 */}
                    {Array.from({ length: 9 }).map((__, c) => (
                      <View
                        key={c}
                        style={{
                          width: HOLE_WIDTH,
                          alignItems: "center",
                        }}
                      >
                        <Skeleton isDark={isDark} height={12} width={16} />
                      </View>
                    ))}
                    <View style={{ width: TOTAL_WIDTH, alignItems: "center" }}>
                      <Skeleton isDark={isDark} height={12} width={20} />
                    </View>
                    {/* Holes 10..18 */}
                    {Array.from({ length: 9 }).map((__, c) => (
                      <View
                        key={c + 9}
                        style={{
                          width: HOLE_WIDTH,
                          alignItems: "center",
                        }}
                      >
                        <Skeleton isDark={isDark} height={12} width={16} />
                      </View>
                    ))}
                    <View style={{ width: TOTAL_WIDTH, alignItems: "center" }}>
                      <Skeleton isDark={isDark} height={12} width={20} />
                    </View>
                    {/* Totals */}
                    <View style={{ width: STAT_WIDTH, alignItems: "center" }}>
                      <Skeleton isDark={isDark} height={12} width={22} />
                    </View>
                    {showNetColumn && (
                      <View style={{ width: STAT_WIDTH, alignItems: "center" }}>
                        <Skeleton isDark={isDark} height={12} width={22} />
                      </View>
                    )}
                    <View style={{ width: STAT_WIDTH, alignItems: "center" }}>
                      <Skeleton isDark={isDark} height={12} width={22} />
                    </View>
                    {/* Stats */}
                    {Array.from({ length: 3 }).map((__, c) => (
                      <View
                        key={c + 20}
                        style={{
                          width: MINI_STAT_WIDTH,
                          alignItems: "center",
                        }}
                      >
                        <Skeleton isDark={isDark} height={12} width={16} />
                      </View>
                    ))}
                  </HStack>
                ))}
              </VStack>
            </ScrollView>
          </HStack>
        </View>
      </ScrollView>
    );
  };

  const getHolePar = (holeNum: number) => {
    const h = holes.find((item) => item.holeNumber === holeNum);
    return h?.par ?? 4;
  };

  const getScoreBadgeStyle = (score: number | undefined, par: number) => {
    if (score == null) {
      return {
        bg: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
        text: isDark ? "#64748b" : "#94a3b8",
        border: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      };
    }
    const diff = score - par;
    if (diff <= -2) {
      // Eagle or better
      return {
        bg: "#f59e0b",
        text: "#ffffff",
        border: "#d97706",
      };
    }
    if (diff === -1) {
      // Birdie
      return {
        bg: "#16a34a",
        text: "#ffffff",
        border: "#15803d",
      };
    }
    if (diff === 0) {
      // Par
      return {
        bg: isDark ? "rgba(255,255,255,0.08)" : "#f8fafc",
        text: isDark ? "#e2e8f0" : "#1e293b",
        border: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
      };
    }
    if (diff === 1) {
      // Bogey
      return {
        bg: isDark ? "rgba(239, 68, 68, 0.12)" : "#fee2e2",
        text: isDark ? "#fca5a5" : "#b91c1c",
        border: isDark ? "rgba(239, 68, 68, 0.3)" : "#fca5a5",
      };
    }
    // Double Bogey or worse
    return {
      bg: isDark ? "rgba(239, 68, 68, 0.22)" : "#fecaca",
      text: isDark ? "#f87171" : "#991b1b",
      border: "#ef4444",
    };
  };

  const renderEmptyStandings = () => (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 20,
        padding: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.06)",
        backgroundColor: isDark
          ? "rgba(15, 23, 42, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      }}
    >
      <Ionicons
        name="golf-outline"
        size={40}
        color={isDark ? "#64748b" : "#94a3b8"}
        style={{ marginBottom: 12 }}
      />
      <ThemedText
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: isDark ? "#ffffff" : "#0f172a",
          textAlign: "center",
        }}
      >
        No Scores Posted Yet
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 12,
          color: isDark ? "#94a3b8" : "#64748b",
          textAlign: "center",
          marginTop: 4,
        }}
      >
        Scores will appear live once players start submitting their hole scores.
      </ThemedText>
    </View>
  );

  const renderDetailedGrid = () => (
    <VStack style={{ gap: 8 }}>
      <View
        style={{
          marginHorizontal: 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(139, 195, 74, 0.35)"
            : "rgba(139, 195, 74, 0.45)",
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.7)"
            : "rgba(255, 255, 255, 0.7)",
          overflow: "hidden",
        }}
      >
        <HStack>
          {/* Fixed left block */}
          <VStack style={{ width: leftFixedWidth }}>
            {renderTableHeaderLeft()}
            {holes.length > 0 && (
              <>
                {renderInfoRowLeft("PAR", holes, "par")}
                {renderInfoRowLeft("STROKE\nINDEX", holes, "si")}
              </>
            )}
            {leaderboard.map((player, idx) => {
              const hasNetScores =
                Object.keys(player.holeNetScores || {}).length > 0;
              const hasStablefordPoints =
                Object.keys(player.holeStablefordPoints || {}).length > 0;
              return (
                <React.Fragment key={player.userId}>
                  {renderPlayerRowLeft(player, idx)}
                  {hasNetScores &&
                    renderPlayerSubRowLeft(player, idx, "Net")}
                  {hasStablefordPoints &&
                    renderPlayerSubRowLeft(player, idx, "Pts")}
                </React.Fragment>
              );
            })}
          </VStack>

          {/* Horizontally scrollable right block */}
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            showsHorizontalScrollIndicator
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onScrollEndDrag={() => {
              isDraggingRef.current = false;
            }}
            onMomentumScrollEnd={() => {
              isDraggingRef.current = false;
            }}
            onScroll={(e) => {
              const currentX = e.nativeEvent.contentOffset.x;
              if (currentX >= 0) {
                scrollXRef.current = currentX;
              }
            }}
            onContentSizeChange={() => {
              if (
                scrollXRef.current > 0 &&
                horizontalScrollRef.current &&
                !isDraggingRef.current
              ) {
                horizontalScrollRef.current.scrollTo({
                  x: scrollXRef.current,
                  animated: false,
                });
              }
            }}
          >
            <VStack style={{ width: rightContentWidth }}>
              {renderTableHeaderRight()}
              {holes.length > 0 && (
                <>
                  {renderInfoRowRight(holes, "par")}
                  {renderInfoRowRight(holes, "si")}
                </>
              )}
              {leaderboard.map((player, idx) => {
                const hasNetScores =
                  Object.keys(player.holeNetScores || {}).length > 0;
                const hasStablefordPoints =
                  Object.keys(player.holeStablefordPoints || {}).length > 0;
                return (
                  <React.Fragment key={player.userId}>
                    {renderPlayerRowRight(player, idx)}
                    {hasNetScores &&
                      renderPlayerSubRowRight(player, idx, "net")}
                    {hasStablefordPoints &&
                      renderPlayerSubRowRight(player, idx, "points")}
                  </React.Fragment>
                );
              })}
            </VStack>
          </ScrollView>
        </HStack>
      </View>

      {/* Helpful Hint */}
      <HStack
        style={{
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginVertical: 4,
        }}
      >
        <Ionicons
          name="information-circle-outline"
          size={14}
          color={isDark ? "#94a3b8" : "#64748b"}
        />
        <ThemedText
          style={{
            fontSize: 11,
            color: isDark ? "#94a3b8" : "#64748b",
            fontWeight: "500",
          }}
        >
          Tap any player name to view history or authenticate
        </ThemedText>
      </HStack>
    </VStack>
  );

  return (
    <ThemedView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#161618" : "#ffffff",
      }}
    >
      <Watermark />

      {/* 🔄 Leaderboard Area (Rotates header + table when toggled) */}
      <View
        style={{ flex: 1, overflow: "hidden" }}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setContainerDimensions({ width, height });
          }
        }}
      >
        <View
          style={
            isCardRotated &&
            containerDimensions.width > 0 &&
            containerDimensions.height > 0
              ? {
                  width: containerDimensions.height,
                  height: containerDimensions.width,
                  position: "absolute",
                  top:
                    (containerDimensions.height - containerDimensions.width) /
                    2,
                  left:
                    (containerDimensions.width - containerDimensions.height) /
                    2,
                  transform: [{ rotate: "90deg" }],
                }
              : { flex: 1 }
          }
        >
          {renderHeader()}
          {renderStatsSection()}

          {loading ? (
            renderTableLoadingSkeleton()
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 25 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#8bc34a"]}
                  tintColor="#8bc34a"
                />
              }
            >
              {leaderboard.length === 0 ? (
                renderEmptyStandings()
              ) : (
                renderDetailedGrid()
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Action Modal triggered on tapping any player in Detailed Grid */}
      <Modal
        visible={!!selectedPlayerAction}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlayerAction(null)}
      >
        <Pressable
          onPress={() => setSelectedPlayerAction(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {selectedPlayerAction && (
              <VStack style={{ gap: 14 }}>
                {/* Header */}
                <HStack
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <VStack style={{ flex: 1 }}>
                    <HStack style={{ alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 6,
                          backgroundColor: "#8bc34a",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ThemedText
                          style={{
                            color: "#fff",
                            fontWeight: "800",
                            fontSize: 12,
                          }}
                        >
                          {selectedPlayerAction.rank || "-"}
                        </ThemedText>
                      </View>
                      <ThemedText
                        style={{ fontSize: 16, fontWeight: "700" }}
                        numberOfLines={1}
                      >
                        {selectedPlayerAction.playerName}
                      </ThemedText>
                    </HStack>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        color: isDark ? "#94a3b8" : "#64748b",
                        marginTop: 2,
                      }}
                    >
                      HCP {selectedPlayerAction.handicap ?? "-"}
                      {isSystem36 &&
                      selectedPlayerAction.dpHandicap != null
                        ? ` • SHCP ${selectedPlayerAction.dpHandicap}`
                        : ""}
                    </ThemedText>
                  </VStack>

                  <TouchableOpacity
                    onPress={() => setSelectedPlayerAction(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color={isDark ? "#94a3b8" : "#64748b"}
                    />
                  </TouchableOpacity>
                </HStack>

                {/* Quick Score Overview */}
                <HStack
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#f8fafc",
                    borderRadius: 10,
                    padding: 10,
                    justifyContent: "space-around",
                  }}
                >
                  <VStack style={{ alignItems: "center" }}>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      GROSS
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#84cc16",
                        marginTop: 2,
                      }}
                    >
                      {selectedPlayerAction.gross ?? "-"}
                    </ThemedText>
                  </VStack>
                  {showNetColumn && (
                    <VStack style={{ alignItems: "center" }}>
                      <ThemedText
                        style={{
                          fontSize: 10,
                          color: isDark ? "#94a3b8" : "#64748b",
                          fontWeight: "600",
                        }}
                      >
                        NET
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: "#3b82f6",
                          marginTop: 2,
                        }}
                      >
                        {selectedPlayerAction.net ?? "-"}
                      </ThemedText>
                    </VStack>
                  )}
                  <VStack style={{ alignItems: "center" }}>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      POINTS
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: "800",
                        color: "#16a34a",
                        marginTop: 2,
                      }}
                    >
                      {selectedPlayerAction.points ?? "-"}
                    </ThemedText>
                  </VStack>
                  <VStack style={{ alignItems: "center" }}>
                    <ThemedText
                      style={{
                        fontSize: 10,
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      OUT / IN
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        marginTop: 2,
                      }}
                    >
                      {selectedPlayerAction.front9 ?? "-"} /{" "}
                      {selectedPlayerAction.back9 ?? "-"}
                    </ThemedText>
                  </VStack>
                </HStack>

                {/* Actions */}
                <VStack style={{ gap: 8, marginTop: 4 }}>
                  {selectedPlayerAction.scorecardId ? (
                    <Pressable
                      onPress={() => {
                        const p = selectedPlayerAction;
                        setSelectedPlayerAction(null);
                        routePage.push({
                          pathname:
                            "/(drawer)/(user)/(tabs)/tournaments/tournamentHistory",
                          params: {
                            tournamentId,
                            tournamentName,
                            teeBoxId: teeboxId,
                            scoringType,
                            scorecardId: p.scorecardId,
                            handicap: p.handicap,
                          },
                        });
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#399bb4",
                        borderRadius: 10,
                        paddingVertical: 11,
                        paddingHorizontal: 16,
                        gap: 8,
                      }}
                    >
                      <Ionicons name="eye-outline" size={16} color="#ffffff" />
                      <ThemedText
                        numberOfLines={1}
                        style={{
                          color: "#ffffff",
                          fontWeight: "700",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        View History
                      </ThemedText>
                    </Pressable>
                  ) : null}

                  {selectedPlayerAction.isAuthenticated ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#16a34a",
                        borderRadius: 10,
                        paddingVertical: 10,
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#ffffff"
                      />
                      <ThemedText
                        numberOfLines={1}
                        style={{
                          color: "#ffffff",
                          fontWeight: "700",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        Scorecard Verified
                      </ThemedText>
                    </View>
                  ) : selectedPlayerAction.userId !== currentUserId &&
                    selectedPlayerAction.scorecardId ? (
                    <Pressable
                      onPress={() => {
                        handleAuthenticate(selectedPlayerAction);
                        setSelectedPlayerAction(null);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#8bc34a",
                        borderRadius: 10,
                        paddingVertical: 11,
                        paddingHorizontal: 16,
                        gap: 8,
                      }}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={16}
                        color="#ffffff"
                      />
                      <ThemedText
                        numberOfLines={1}
                        style={{
                          color: "#ffffff",
                          fontWeight: "700",
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        Authenticate Scorecard
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </VStack>
              </VStack>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 10.5,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 45,
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 50,
  },
  subCellText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 36,
  },
  infoCellText: {
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 40,
    opacity: 0.6,
  },
  infoLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    textAlign: "left",
    paddingLeft: 6,
    lineHeight: 13,
    color: "#84cc16",
  },
  cell: {
    justifyContent: "center",
    alignItems: "center",
  },
  scoreCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
