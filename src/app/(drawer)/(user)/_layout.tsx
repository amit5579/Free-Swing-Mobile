import { Stack } from 'expo-router';

export default function UserLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scorecard/view/[scoreCard]" options={{ headerShown: false }} />
            <Stack.Screen name="scorecard/resume/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="(teeTimeBooking)" options={{ headerShown: false }} />
            <Stack.Screen name="(contactAdmin)/index" options={{ headerShown: false }} />
        </Stack>
    );
}
