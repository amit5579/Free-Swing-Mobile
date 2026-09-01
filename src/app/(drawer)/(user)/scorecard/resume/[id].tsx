import React from "react";
import { useLocalSearchParams } from "expo-router";
import { UnifiedScorecard } from "@/components/scorecard/UnifiedScorecard";

export default function ResumeScorecardPage() {
  const {
    id,
    handicap,
    courseName,
    date,
    scoringType,
    tournamentId,
    courseId,
    teeBoxId,
  } = useLocalSearchParams<{
    id: string;
    handicap?: string;
    courseName?: string;
    date?: string;
    scoringType?: string;
    tournamentId?: string;
    courseId?: string;
    teeBoxId?: string;
  }>();

  return (
    <UnifiedScorecard
      mode="resume"
      scorecardId={id}
      handicap={handicap}
      courseName={courseName}
      date={date}
      scoringType={scoringType}
      tournamentId={tournamentId}
      courseId={courseId}
      teeBoxId={teeBoxId}
    />
  );
}
