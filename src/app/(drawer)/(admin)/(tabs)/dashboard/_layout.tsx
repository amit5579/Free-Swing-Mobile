import { Stack } from "expo-router";

export default function dashboardLayout() {
  return (
    <Stack>
        <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="playerStatistics"
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="playerHistory"
        options={{ headerShown: false, presentation: 'modal' }}
      />

      <Stack.Screen
        name="gameFeed"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}