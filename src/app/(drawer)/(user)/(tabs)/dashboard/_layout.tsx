import { Stack } from "expo-router";

export default function dashboardLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="scoreCard"
        options={{
         headerShown: false
        }}
      />
    </Stack>
    
  );
}
