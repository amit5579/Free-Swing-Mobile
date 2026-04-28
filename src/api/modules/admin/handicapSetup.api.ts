import client from "../../client";

export type User = {
  id: string;
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

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await client.get("/User/list");
    return response.data;
  } catch (error) {
    console.error("Fetching Users Error:", error);
    return [];
  }
};

export const updateHandicapApi = async (
  userId: string | number,
  handicap: number,
): Promise<boolean> => {
  try {

    const response = await client.put(
      `/User/set-handicap/${userId}`,
      handicap,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📡 Update status for ${userId}:`, response.status);
    return response.status >= 200 && response.status < 300;
  } catch (error: any) {
    console.error("Update Handicap Error details:", error.response?.data || error.message);
    return false;
  }
};