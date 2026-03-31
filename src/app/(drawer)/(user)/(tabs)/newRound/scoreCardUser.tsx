import { getScoreCardDetails } from "@/api/newRound";
import { HStack } from "@/components/hstack";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/vstack";
import Watermark from "@/components/watermark";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function ScoreCardUserPage() {
      const { excluded,stableford,holes,handicap, courseId,teeBoxId } = useLocalSearchParams();
    
      const routePage = useRouter();
      const scheme = useColorScheme();
      const isDark = scheme === "dark";
      const [scoreCardDetails, setScoreCardDetails] = useState<any>([]);
  const [loading, setLoading] = useState(false);

const fetchScoreCard = async () => {
    try {
        setLoading(true);
        const response = await getScoreCardDetails(Number(teeBoxId), Number(courseId));

        setScoreCardDetails(response);
    } catch (error) {
        console.error("Fetching scorecard Error:", error);
        throw error;
    } finally {
        setLoading(false);
    }
};

useEffect(()=>{
    fetchScoreCard();
    console.log(scoreCardDetails);
    
},[])


  const RenderHeader = () => {
    return (
      <>
        <HStack
          className="px-3 pt-5 items-center"
          style={{ justifyContent: "space-between" }}
        >
          {/* LEFT: Back button */}
          <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={isDark ? "#ffffff" : "#020617"}
            />
          </Pressable>

          {/* CENTER: Title */}
          <ThemedText
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Scorecard User
          </ThemedText>

          {/* RIGHT: Add Button */}
          <View style={{ width: 40 }} />
        </HStack>
        <HStack className="justify-between px-5 items-center"><ThemedText
          style={{
            textAlign: "center",
            fontSize: 16,
            fontWeight: "400",
            lineHeight: 30,
          }}
        >
            {excluded === "true" && stableford === "false" && (
                <ThemedText>(Net Score Exclude Par 3)</ThemedText>
            )}
            {excluded === "false" && stableford === "true" && (
                <ThemedText>(Stableford)</ThemedText>
            )}
            {excluded === "false" && stableford === "false" && (
                <ThemedText>(Net Score Include Par 3)</ThemedText>
            )}
        </ThemedText>
        <ThemedText>Handicap: {handicap as string}</ThemedText>
        </HStack>
        
      </>
    );
  };
  return (
    <>
      <View
        style={{
          flex: 1,
        }}
      >
        {/* Header */}

        <RenderHeader />

        <Watermark />

        <ScrollView showsVerticalScrollIndicator={false}>
          <VStack className="px-4 pt-6 pb-20">
            <VStack className="gap-4">
              {loading ? (
                <>
                  <ThemedText>Loading...</ThemedText>
                </>
              ) : (
                <>
                  <ThemedText>This is scorecard page</ThemedText>
                </>
              )}
            </VStack>
          </VStack>
        </ScrollView>
      </View>
    </>
  );
}
