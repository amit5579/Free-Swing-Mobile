import https from "../https";

export type User = {
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

// GET all users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await https.get("/User/list");
    return response.data;
  } catch (error) {
    console.error("Fetching Users Error:", error);
    return [];
  }
};