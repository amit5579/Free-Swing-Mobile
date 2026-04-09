import { Stack } from "expo-router";

export default function playersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="subGameHistory" options={{ headerShown: false }} />
      <Stack.Screen name="subHistoryScoreCard" options={{ headerShown: false }} />
    </Stack>
  );
}
