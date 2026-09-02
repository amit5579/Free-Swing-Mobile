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
                    ? "rgba(45, 55, 72, 0.45)"
                    : "rgba(224, 242, 254, 0.45)"
                  : isDark
                    ? "rgba(30, 33, 36, 0.35)"
                    : "rgba(241, 245, 249, 0.35)",
                borderColor: isSelected
                  ? "#0284c7"
                  : isDark
                    ? "#333b46"
                    : "#cbd5e1",
              },
            ]}
          >
            {showTeams && (
              <View style={styles.headerTop}>
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
              </View>
            )}

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
                  {
                    backgroundColor: isDark
                      ? "rgba(42, 46, 51, 0.45)"
                      : "rgba(226, 232, 240, 0.45)",
                  },
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
    fontSize: 10,
    fontWeight: "800",
  },
  statusBadge: {
    marginLeft: 2,
  },
  playerName: {
    fontSize: 14,
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
    fontSize: 11,
    fontWeight: "600",
  },
});
