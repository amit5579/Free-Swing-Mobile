import https from "../https";


export type UserApi = {
  id: number;
  username: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string | null;
  role: string;
  handicap: number;
  handicapIndex: number;
  homeCourse: string | null;
  slope: number | null;
  rating: number | null;
  isBlocked: boolean;
  profilePictureUrl: string | null;
};

export const getUserById = async (id: number): Promise<UserApi> => {
  try {
    const response = await https.get(`/User/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching user:", error?.response?.data || error.message);
    throw error;
  }
};

export const getSubAdminPlayers = async (): Promise<UserApi[]> => {
  try {
    const response = await https.get("/SubAdmin/my-players");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching subAdmin players:", error?.response?.data || error.message);
    return [];
  }
};

export type SubAdminCourse = {
  courseId: number;
  name: string;
  location: string;
};

export const getSubAdminCourses = async (): Promise<SubAdminCourse[]> => {
  try {
    const response = await https.get("/SubAdmin/my-courses");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching subAdmin courses:", error?.response?.data || error.message);
    return [];
  }
};

export type UpdateApi = {
  id: number;
  content: string | null;
  mediaUrl: string | null;
  linkUrl: string | null;
  type: string;
  authorId: number;
  authorName: string;
  createdAt: string;
};

export const getUpdates = async (): Promise<UpdateApi[]> => {
  try {
    const response = await https.get("/Updates");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching updates:", error?.response?.data || error.message);
    return [];
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

export const getFeed = async (): Promise<FeedApi[]> => {
  try {
    const response = await https.get("/feed");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching feed:", error?.response?.data || error.message);
    return [];
  }
};
