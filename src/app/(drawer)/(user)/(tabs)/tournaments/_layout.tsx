import { Stack } from "expo-router";

export default function tournamentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboardUser" options={{ headerShown: false }} />
      <Stack.Screen name="tournamentHistory" options={{ headerShown: false }} />
      <Stack.Screen name="manageTournament" options={{ headerShown: false }} />
      <Stack.Screen name="playScoreCard" options={{ headerShown: false }} />
    </Stack>
  );
}
