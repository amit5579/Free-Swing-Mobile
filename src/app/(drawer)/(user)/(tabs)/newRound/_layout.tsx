import { Stack } from "expo-router";

export default function NewRoundLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="scoreCardUser" options={{ headerShown: false }} />
        </Stack>
    );
}