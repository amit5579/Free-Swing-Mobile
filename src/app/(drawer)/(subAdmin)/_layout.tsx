import { Stack } from 'expo-router';

export default function SubAdminRootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(contactAdmin)/index" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
