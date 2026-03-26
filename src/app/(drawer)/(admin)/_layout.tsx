import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';

/**
 * Role guard for admin-side routes.
 * If the logged-in role is NOT "Admin", this layout renders nothing — preventing
 * any admin-side tab bar or screens from being visible to regular users.
 * No redirect is fired here; redirects are handled at the auth/login level.
 */
export default function AdminRootLayout() {
    const [checked, setChecked] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('role').then(role => {
            setIsAdmin(role === 'Admin');
            setChecked(true);
        }).catch(() => {
            setIsAdmin(false);
            setChecked(true);
        });
    }, []);

    // Briefly show nothing while we check (avoids flash of wrong UI)
    if (!checked) {
        return (
            <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        );
    }

    // Regular user landed here somehow — render nothing, don't interfere with navigation
    if (!isAdmin) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(feedbackInbox)" options={{ headerShown: false }} />
            <Stack.Screen name="(combinedLeaderboards)" options={{ headerShown: false }} />
            <Stack.Screen name="(handicapSetup)" options={{ headerShown: false }} />
            <Stack.Screen name="(subAdmins)" options={{ headerShown: false }} />
        </Stack>
    );
}
