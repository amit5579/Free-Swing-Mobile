import React from "react";
import { useLocalSearchParams } from "expo-router";
import { UnifiedScorecard } from "@/components/scorecard/UnifiedScorecard";

const ScoreCardViewPage: React.FC = () => {
  const {
    scoreCard,
    handicap,
    username,
    courseName,
    scoringType,
    tournamentId,
    courseId,
    teeBoxId,
  } = useLocalSearchParams<{
    scoreCard: string;
    handicap?: string;
    username?: string;
    courseName?: string;
    scoringType?: string;
    tournamentId?: string;
    courseId?: string;
    teeBoxId?: string;
  }>();

  return (
    <UnifiedScorecard
      mode="view"
      scorecardId={scoreCard}
      handicap={handicap}
      username={username}
      courseName={courseName}
      scoringType={scoringType}
      tournamentId={tournamentId}
      courseId={courseId}
      teeBoxId={teeBoxId}
    />
  );
};

export default ScoreCardViewPage;
