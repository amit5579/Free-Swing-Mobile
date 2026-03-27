import https from "../https";

export type UserListApi = {
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
  dateOfBirth: string | null;
  homeCourse: string | null;
  slope: number | null;
  rating: number | null;
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  handicap: number;
  handicapIndex: number | null;
  totalRounds: number;
  coursesPlayed: number;
  averageScore: number;
  calculatedHandicap: number;
  isBlocked: boolean;
  avatar: string | null;
  invitedBy: string | null;
};

export const getUsers = async (): Promise<UserListApi[]> => {
  try {
    const response = await https.get("/User/list");
    return response.data;
  } catch (error) {
    console.error("Get Users API Error:", error);
    return [];
  }
};