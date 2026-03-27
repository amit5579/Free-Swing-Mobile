import { Stack } from 'expo-router';

export default function AdminRootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(feedbackInbox)" options={{ headerShown: false }} />
            <Stack.Screen name="(combinedLeaderboards)" options={{ headerShown: false }} />
            <Stack.Screen name="(handicapSetup)" options={{ headerShown: false }} />
            <Stack.Screen name="(subAdmins)" options={{ headerShown: false }} />
            <Stack.Screen name="(importantUpdate)" options={{ headerShown: false }} />
        </Stack>
    );
}
