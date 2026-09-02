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
    tournamentName,
    courseId,
    teeBoxId,
    courseHalf,
    holesCount,
    roundContextId,
  } = useLocalSearchParams<{
    id: string;
    handicap?: string;
    courseName?: string;
    date?: string;
    scoringType?: string;
    tournamentId?: string;
    tournamentName?: string;
    courseId?: string;
    teeBoxId?: string;
    courseHalf?: string;
    holesCount?: string;
    roundContextId?: string;
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
      tournamentName={tournamentName}
      courseId={courseId}
      teeBoxId={teeBoxId}
      courseHalf={courseHalf || holesCount}
      holesCount={holesCount || courseHalf}
      roundContextId={roundContextId}
    />
  );
}
