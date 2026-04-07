import { Stack } from "expo-router";

export default function tournamentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* <Stack.Screen name="managePlayers" options={{ headerShown: false }} />
      <Stack.Screen name="tournamentHistory" options={{ headerShown: false }} />
      <Stack.Screen name="playerScorecard" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="subGameHistory" options={{ title: "Game History" }} />
      <Stack.Screen name="subHistoryScoreCard" options={{ title: "Scorecard" }} /> */}
    </Stack>
  );
}
