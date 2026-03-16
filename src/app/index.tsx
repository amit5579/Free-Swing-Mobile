import { Redirect } from 'expo-router';
import React from 'react';

export default function HomeScreen() {
  return <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />;
}


// import { Redirect } from 'expo-router';
// import React, { useEffect, useState } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export default function HomeScreen() {
//   const [role, setRole] = React.useState<string | null>(null);

//   React.useEffect(() => {
//     AsyncStorage.getItem('role').then((r) => setRole(r));
//   }, []);

//   if (!role) return null; // or a loading spinner

//   return role === 'admin' ? (
//     <Redirect href="/(drawer)/(admin)/(tabs)/dashboard" />
//   ) : (
//     <Redirect href="/(drawer)/(user)/(tabs)/dashboard" />
//   );
// }