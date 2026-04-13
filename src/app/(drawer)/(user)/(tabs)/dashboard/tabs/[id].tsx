import MemberProfilePage from "@/app/(drawer)/(admin)/(tabs)/allMembers/[id]";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback } from "react";
import { Platform } from "react-native";

export default function UserMemberProfile() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      
      if (parent) {
        parent.setOptions({
          headerShown: false,
          tabBarStyle: { display: "none" },
        });
      }

      return () => {
        if (parent) {
          parent.setOptions({
            headerShown: true,
            tabBarStyle: { display: Platform.OS === "android" ? "flex" : "flex" },
          });
        }
      };
    }, [navigation])
  );

  return <MemberProfilePage />;
}
