import React from "react";
import { useLocalSearchParams } from "expo-router";
import { UnifiedScorecard } from "@/components/scorecard/UnifiedScorecard";

export default function ScoreCardUserPage() {
  const {
    selectedScore,
    holes,
    handicap,
    courseId,
    teeBoxId,
    forceNew,
    numberOfPlayers,
    player2Id,
    player3Id,
    player4Id,
    roundContextId,
    startFrom,
    courseName,
  } = useLocalSearchParams<{
    selectedScore?: string;
    holes?: string;
    handicap?: string;
    courseId?: string;
    teeBoxId?: string;
    forceNew?: string;
    numberOfPlayers?: string;
    player2Id?: string;
    player3Id?: string;
    player4Id?: string;
    roundContextId?: string;
    startFrom?: string;
    courseName?: string;
  }>();

  return (
    <UnifiedScorecard
      mode="new-round"
      selectedScore={selectedScore}
      holesCount={holes}
      handicap={handicap}
      courseId={courseId}
      teeBoxId={teeBoxId}
      forceNew={forceNew}
      roundContextId={roundContextId}
      startFrom={startFrom}
      courseName={courseName}
    />
  );
}
