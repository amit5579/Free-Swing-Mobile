import React from "react";
import { useLocalSearchParams } from "expo-router";
import { UnifiedScorecard } from "@/components/scorecard/UnifiedScorecard";

export default function PlayScoreCardPage() {
  const {
    tournamentId,
    teeBoxId,
    courseId,
    scoringType,
    handicap,
    tournamentName,
    courseName,
  } = useLocalSearchParams<{
    tournamentId?: string;
    teeBoxId?: string;
    courseId?: string;
    scoringType?: string;
    handicap?: string;
    tournamentName?: string;
    courseName?: string;
  }>();

  return (
    <UnifiedScorecard
      mode="tournament-play"
      isTabScreen={true}
      tournamentId={tournamentId}
      teeBoxId={teeBoxId}
      courseId={courseId}
      scoringType={scoringType}
      handicap={handicap}
      tournamentName={tournamentName}
      courseName={courseName}
    />
  );
}
