import { Stack } from "expo-router";

export default function tournamentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="leaderboardUser"
        options={{
          title: "Leaderboard",
        }}
      />
      <Stack.Screen
        name="scoreCardUser"
        options={{
          title: "Scorecard",
        }}
      />
    </Stack>
    
  );
}
