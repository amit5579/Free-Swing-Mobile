import React from "react";
import { useLocalSearchParams } from "expo-router";
import { UnifiedScorecard } from "@/components/scorecard/UnifiedScorecard";

export default function TournamentHistoryPage() {
  const {
    tournamentId,
    tournamentName,
    teeBoxId,
    scoringType,
    scorecardId,
    handicap,
  } = useLocalSearchParams<{
    tournamentId?: string;
    tournamentName?: string;
    teeBoxId?: string;
    scoringType?: string;
    scorecardId?: string;
    handicap?: string;
  }>();

  return (
    <UnifiedScorecard
      mode="view"
      isTabScreen={true}
      scorecardId={scorecardId}
      tournamentId={tournamentId}
      tournamentName={tournamentName}
      teeBoxId={teeBoxId}
      scoringType={scoringType}
      handicap={handicap}
    />
  );
}
