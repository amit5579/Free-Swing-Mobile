import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RoundPlayer } from "@/utils/scorecardUtils";

export interface PlayerHeaderRowProps {
  players: RoundPlayer[];
  delegationStatuses?: Record<number, string>;
  isDark?: boolean;
  activePlayerId?: string;
  onSelectPlayer?: (playerId: string) => void;
  showTeams?: boolean;
}

export const PlayerHeaderRow: React.FC<PlayerHeaderRowProps> = ({
  players,
  delegationStatuses = {},
  isDark = false,
  activePlayerId,
  onSelectPlayer,
  showTeams = false,
}) => {
  const renderDelegationIcon = (player: RoundPlayer) => {
    if (player.isPrimary || !player.userId) return null;
    const status = (delegationStatuses[player.userId] || "").toLowerCase();

    if (status === "approved" || status === "accepted") {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#22c55e" />
        </View>
      );
    }
    if (status === "pending") {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="time" size={13} color="#eab308" />
        </View>
      );
    }
    if (status === "rejected" || status === "declined") {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="close-circle" size={13} color="#ef4444" />
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {players.map((player) => {
        const isSelected = activePlayerId === player.playerId;
        const isTeamA = player.team === 1;
        const hc =
          player.courseHandicap ??
          player.appliedHandicap ??
          player.handicap ??
          player.userHandicap;

        return (
          <Pressable
            key={player.playerId}
            disabled={!onSelectPlayer}
            onPress={() => onSelectPlayer && onSelectPlayer(player.playerId)}
            style={[
              styles.playerCard,
              {
                backgroundColor: isSelected
                  ? isDark
                    ? "#2d3748"
                    : "#e0f2fe"
                  : isDark
                    ? "#1e2124"
                    : "#f1f5f9",
                borderColor: isSelected
                  ? "#0284c7"
                  : isDark
                    ? "#333b46"
                    : "#cbd5e1",
              },
            ]}
          >
            <View style={styles.headerTop}>
              {showTeams && (
                <View
                  style={[
                    styles.teamPill,
                    {
                      backgroundColor: isTeamA
                        ? isDark
                          ? "#14532d"
                          : "#dcfce7"
                        : isDark
                          ? "#1e3a8a"
                          : "#dbeafe",
                      borderColor: isTeamA ? "#22c55e" : "#3b82f6",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.teamText,
                      { color: isTeamA ? "#16a34a" : "#2563eb" },
                    ]}
                  >
                    Team {player.team ?? 1}
                  </Text>
                </View>
              )}

              {renderDelegationIcon(player)}
            </View>

            <Text
              numberOfLines={1}
              style={[
                styles.playerName,
                { color: isDark ? "#ffffff" : "#0f172a" },
              ]}
            >
              {player.name}
            </Text>

            {hc !== undefined && hc !== null && (
              <View
                style={[
                  styles.hcBadge,
                  { backgroundColor: isDark ? "#2a2e33" : "#e2e8f0" },
                ]}
              >
                <Text
                  style={[
                    styles.hcText,
                    { color: isDark ? "#cbd5e1" : "#475569" },
                  ]}
                >
                  HC: {hc}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  playerCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 4,
  },
  teamPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  teamText: {
    fontSize: 9,
    fontWeight: "800",
  },
  statusBadge: {
    marginLeft: 2,
  },
  playerName: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  hcBadge: {
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hcText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
