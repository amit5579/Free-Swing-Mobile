import { Stack } from "expo-router";

export default function subTournamentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="manageRoaster" options={{ headerShown: false }} />
      <Stack.Screen name="tournamentHistory" options={{ headerShown: false }} />
      <Stack.Screen name="playerScorecard" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="manageGroups" options={{ headerShown: false }} />
    </Stack>
  );
}
