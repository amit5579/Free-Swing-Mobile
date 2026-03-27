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
  isApproved: boolean;
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

//
// ✅ NEW FUNCTIONS (ADD THESE)
//

// Approve user
export const approveUser = async (id: number) => {
  try {
    const response = await https.post(`/User/approve/${id}`);
    return response.data;
  } catch (error) {
    console.error("Approve User API Error:", error);
    throw error;
  }
};

// Deny user
export const denyUser = async (id: number) => {
  try {
    const response = await https.delete(`/User/deny/${id}`);
    return response.data;
  } catch (error) {
    console.error("Deny User API Error:", error);
    throw error;
  }
};

// Block / Unblock user
export const toggleBlockUser = async (id: number) => {
  try {
    const response = await https.patch(`/User/toggle-block/${id}`);
    return response.data;
  } catch (error) {
    console.error("Toggle Block API Error:", error);
    throw error;
  }
};