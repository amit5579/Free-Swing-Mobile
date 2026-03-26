import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

/**
 * Role guard for user-side routes.
 * If the logged-in role is "Admin", this layout renders nothing — preventing
 * any user-side tab bar or screens from being visible to admins.
 * No redirect is fired here; redirects are handled at the auth/login level.
 */
export default function UserLayout() {
    const [checked, setChecked] = useState(false);
    const [isUser, setIsUser] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('role').then(role => {
            setIsUser(role !== 'Admin');
            setChecked(true);
        }).catch(() => {
            setIsUser(true);
            setChecked(true);
        });
    }, []);

    // Briefly show nothing while we check (avoids flash of wrong UI)
    if (!checked) {
        return (
            <View style={{ flex: 1, backgroundColor: 'transparent' }} />
        );
    }

    // Admin landed here somehow — render nothing, don't interfere with navigation
    if (!isUser) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    );
}
