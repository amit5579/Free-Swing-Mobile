import { Stack } from 'expo-router';

export default function SubAdminRootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* <Stack.Screen name="(feedbackInbox)/index" options={{ headerShown: false }} />
            <Stack.Screen name="(combinedLeaderboards)/index" options={{ headerShown: false }} />
            <Stack.Screen name="(handicapSetup)" options={{ headerShown: false }} />
            <Stack.Screen name="(subAdmins)" options={{ headerShown: false }} />
            <Stack.Screen name="(importantUpdate)/index" options={{ headerShown: false }} />
            <Stack.Screen name="scorecard/view/[scoreCard]" options={{ headerShown: false }} />
            <Stack.Screen name="scorecard/resume/[id]" options={{ headerShown: false }} /> */}
        </Stack>
    );
}
