import { Stack } from "expo-router";

export default function tournamentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="managePlayers" options={{ headerShown: false }} />
      <Stack.Screen
        name="tournamentHistory"
        options={{
          title: "Tournament History",
        }}
      />
      <Stack.Screen
        name="playerScorecard"
        options={{
          title: "Scorecard",
        }}
      />
      <Stack.Screen
        name="leaderboard"
        options={{
          title: "Leaderboard",
        }}
      />
    </Stack>
  );
}
