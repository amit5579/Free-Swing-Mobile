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
    tournamentName,
    courseId,
    teeBoxId,
    courseHalf,
    holesCount,
  } = useLocalSearchParams<{
    scoreCard: string;
    handicap?: string;
    username?: string;
    courseName?: string;
    scoringType?: string;
    tournamentId?: string;
    tournamentName?: string;
    courseId?: string;
    teeBoxId?: string;
    courseHalf?: string;
    holesCount?: string;
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
      tournamentName={tournamentName}
      courseId={courseId}
      teeBoxId={teeBoxId}
      courseHalf={courseHalf || holesCount}
      holesCount={holesCount || courseHalf}
    />
  );
};

export default ScoreCardViewPage;
