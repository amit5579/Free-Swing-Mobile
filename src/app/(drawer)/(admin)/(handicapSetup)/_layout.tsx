import { Stack } from "expo-router";

export default function HandicapSetupLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Handicap Setup",
          headerShown: false,
        }}
      />
    </Stack>
  );
}