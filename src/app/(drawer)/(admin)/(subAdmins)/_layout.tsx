import { Stack } from "expo-router";

export default function SubAdminsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Sub Admins", headerShown: false }}
      />
    </Stack>
  );
}