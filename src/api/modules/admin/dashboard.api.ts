// import client from "./client";

import client from "../../client";

export type UserApi = {
  id: number;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  handicap: number;
  handicapIndex: number | null;
  homeCourse: string | null;
  isBlocked: boolean;
  profilePictureUrl: string;
};

export const getUserById = async (id: number): Promise<UserApi | null> => {
  try {
    const response = await client.get(`User/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get User API Error:", error);
    return null;
  }
};



export type TeeBox = {
  teeBoxId: number;
  courseId: number;
  name: string;
  rating: number;
  slope: number;
  color: string;
};

export type CourseApi = {
  courseId: number;
  name: string;
  location: string;
  isPremium: boolean;
  isPredefined: boolean;
  createdDate: string;
  updatedDate: string | null;
  teeBoxes: TeeBox[];
};

export const getCourses = async (): Promise<CourseApi[]> => {
  try {
    const response = await client.get("/course");
    return response.data;
  } catch (error) {
    console.error("Get Courses API Error:", error);
    return [];
  }
};



export type PlayerApi = {
  id: number;
  username: string;
  email: string;
  mobileNumber: string;
  role: string;
  handicap: number;
  handicapIndex: number | null;
  totalRounds: number;
  coursesPlayed: number;
  averageScore: number;
  calculatedHandicap: number;
  isBlocked: boolean;
  profilePictureUrl: string | null;
  invitedBySubAdminId: number | null;
  invitedBySubAdminName: string | null;
};

export type Player = {
  id: number;
  name: string;
  email: string;
  phone: string;
  handicap: number;
  averageScore: number;
  totalRounds: number;
  image: { uri: string | null };
};

export const getPlayers = async (): Promise<PlayerApi[]> => {
  try {
    const response = await client.get("/user/list");
    return response.data;
  } catch (error) {
    console.error("Get Players API Error:", error);
    return [];
  }
};



export type UpdateApi = {
  id: number;
  content: string | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  type: "text" | "image" | string;
  authorId: number;
  authorName: string;
  createdAt: string;
};

export type Update = {
  id: number;
  text: string;
  image: string | null;
  link: string | null;
  type: string;
  author: string;
  date: string;
};

export const getUpdates = async (): Promise<UpdateApi[]> => {
  try {
    const response = await client.get("/Updates");
    return response.data;
  } catch (error) {
    console.error("Get Updates API Error:", error);
    return [];
  }
};

export const addUpdate = async (formData: FormData): Promise<any> => {
  try {
    const response = await client.post("/Updates", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Adding Update Error:", error);
    throw error;
  }
};

export const deleteUpdate = async (id: number): Promise<any> => {
  try {
    const response = await client.delete(`/Updates/${id}`);
    return response.data;
  } catch (error) {
    console.error("Deleting Update Error:", error);
    throw error;
  }
};



export type FeedApi = {
  roundRefId: number;
  playerName: string;
  playerAvatar: string | null;
  courseName: string;
  teeBoxName: string;
  date: string;
  grossScore: number;
  netScore: number;
  stablefordPoints: number;
  totalPar: number;
  scoreToPar: number;
  holesPlayed: number;
  likeCount: number;
  isLikedByMe: boolean;
  isAuthenticated: boolean;
  authenticatedBy: string | null;
  canAuthenticate: boolean;
  isDQ: boolean;
  isTournament: boolean;
};

export type FeedItem = {
  id: number;
  player: string;
  avatar: string | null;
  course: string;
  teeBox: string;
  date: string;
  gross: number;
  net: number;
  stableford: number;
  par: number;
  scoreToPar: number;
  holes: number;
  likes: number;
  likedByMe: boolean;
  isTournament: boolean;
  isAuthenticated: boolean;
  authenticatedBy: string | null;
  canAuthenticate: boolean;
};

export const getFeed = async (): Promise<FeedApi[]> => {
  try {
    const response = await client.get("/feed");
    return response.data;
  } catch (error) {
    console.error("Get Feed API Error:", error);
    return [];
  }
};



export type ScorecardHistoryApi = {
  scorecardId: number;
  date: string;
  courseName: string;
  score: number;
  netScore: number;
  par: number;
  isDQ: boolean;
  tournamentId: number | null;
};

export type ScorecardHistory = {
  id: number;
  date: string;
  course: string;
  score: number;
  netScore: number;
  par: number;
  isDQ: boolean;
  tournamentId: number | null;
  toPar: number;
};

export const getScorecardHistory = async (
  userId: number
): Promise<ScorecardHistoryApi[]> => {
  try {
    const response = await client.get(`/scorecard/history/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Scorecard History API Error:", error);
    return [];
  }
};



export type ScorecardHoleApi = {
  "holeId": number,
  "holeNumber": number,
  "par": number,
  "strokeIndex": number,
  "yardage": number,
  "teeBoxId": number,
  "courseId": number,
  "score": number | null,
  "netScore": number | null,
  "roundNumber": number,
  "stablefordPoints": number | null,
  "isCompleted": boolean,
  "isDQ": boolean,
  "tournamentId": number | null,
  "isDoublePeoria": boolean,
  "courseHalf": string,
  "isExcluded": boolean
};

export type ScorecardHole = {
  id: number;
  hole: number;
  par: number;
  handicap: number;
  yardage: number;
  score: number;
  netScore: number;
  stableford: number;
  isCompleted: boolean;
  isDQ: boolean;
  tournamentId: number | null;
  isDoublePeoria: boolean;
  toPar: number;
};

export const getScorecardDetails = async (
  scorecardId: number | string
): Promise<ScorecardHoleApi[]> => {
  try {
    const response = await client.get(
      `/scorecard/details/${scorecardId}`
    );
    return response.data;
  } catch (error) {
    console.error("Scorecard Details API Error:", error);
    return [];
  }
};

export const verifyScoreApi = async (roundRefId: number | string) => {
  try {
    const response = await client.post(`/scorecard/authenticate/${roundRefId}`);
    return response.data;
  } catch (error) {
    console.error(`Error verifying scorecard ${roundRefId}:`, error);
    throw error;
  }
};

export const updateScorecardApi = async (scorecardId: string | number, holeScores: { holeId: number, score: number }[]) => {
  try {
    const response = await client.put(`/scorecard/update`, { scorecardId, holeScores });
    return response.data;
  } catch (error) {
    console.error("Updating scorecard error:", error);
    throw error;
  }
};

export const saveScorecardApi = async (scorecardId: string | number) => {
  try {
    const response = await client.post(`/scorecard/save`, { scorecardId });
    return response.data;
  } catch (error) {
    console.error("Saving scorecard error:", error);
    throw error;
  }
};
