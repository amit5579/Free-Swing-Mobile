import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from "react-native";

// Example player data
const players = [
  { id: "1", name: "narender", handicap: 0, rounds: 10, courses: 4, avgScore: 107.3 },
  { id: "2", name: "rks", handicap: 5, rounds: 7, courses: 4, avgScore: 136.6 },
  { id: "3", name: "newuser", handicap: 9, rounds: 2, courses: 2, avgScore: 267.5 },
  { id: "4", name: "r1", handicap: 2, rounds: 3, courses: 2, avgScore: 200.7 },
  { id: "5", name: "test2", handicap: 31, rounds: 7, courses: 6, avgScore: 87.9 },
  { id: "6", name: "test3", handicap: 4, rounds: 18, courses: 5, avgScore: 94.9 },
  { id: "7", name: "t3", handicap: 14, rounds: 1, courses: 1, avgScore: 86 },
  { id: "8", name: "ab", handicap: 14, rounds: 0, courses: 0, avgScore: null },
  { id: "9", name: "q1", handicap: 15, rounds: 1, courses: 1, avgScore: 9 },
  { id: "10", name: "U1", handicap: 18, rounds: 1, courses: 1, avgScore: 169 },
];

const PlayerCard = ({ player }: { player: typeof players[0] }) => {
  return (
    <View style={styles.card}>
      {/* Name + Avatar Row */}
      <View style={styles.nameRow}>
        <Image
          source={{ uri: `https://i.pravatar.cc/100?u=${player.id}` }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{player.name}</Text>
      </View>

      {/* Stats */}
      <View style={styles.row}>
        <Text style={styles.label}>Handicap:</Text>
        <Text style={styles.value}>{player.handicap}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Rounds:</Text>
        <Text style={styles.value}>{player.rounds}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Courses:</Text>
        <Text style={styles.value}>{player.courses}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Avg Score:</Text>
        <Text style={styles.value}>{player.avgScore ?? "-"}</Text>
      </View>

      {/* View History Button */}
      <TouchableOpacity style={styles.historyButton}>
        <Text style={styles.historyText}>View History</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function PlayerStatistics() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player Statistics</Text>
      <Text style={styles.subtitle}>Performance overview of all players.</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PlayerCard player={item} />}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b5e20",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  label: {
    fontSize: 14,
    color: "#555",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  historyButton: {
    marginTop: 12,
    backgroundColor: "#8BC34A",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  historyText: {
    color: "#fff",
    fontWeight: "600",
  },
});