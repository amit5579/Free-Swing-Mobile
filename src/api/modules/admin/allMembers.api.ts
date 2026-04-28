import client from "../../client";

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
  membershipNo: string | null;
  pendingSubscriptionPlanLabel: string | null;
  hasPendingSubscriptionRequest: boolean;
  daysRemaining: number | null;
  activeSubscriptionPlanLabel: string | null;
  subscriptionStatus: string | null;
  pendingSubscriptionRequestedAtUtc: string | null;
  subscriptionApprovedAtUtc: string | null;
  subscriptionStartsAtUtc: string | null;
  subscriptionEndsAtUtc: string | null;
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
    const response = await client.get("/User/list");
    return response.data;
  } catch (error) {
    console.error("Get Users API Error:", error);
    return [];
  }
};

// create member : User/create-player
// payload :
// dateOfBirth: "2002-03-23",
// email: "abc@mail.com",
// handicap: 5,
// handicapIndex: 55,
// homeCourse: "Indian hercules",
// homeCourseId: 17,
// membershipNo: "99999",
// mobileNumber: "1234567890",
// password: "999999999",
// rating: 55,
// slope: 50,
// username: "abc",

export const createMember = async (payload: any): Promise<any> => {
  try {
    const response = await client.post("/User/create-player", payload);
    return response.data;
  } catch (error) {
    console.error("Create User API Error:", error);
    throw error;
  }
};



// approve request - post - User/81/approve-subscription 

export const approveSubscription = async (userId: number): Promise<any> => {
  try {
    const response = await client.post(`User/${userId}/approve-subscription`);
    return response.data;
  } catch (error) {
    console.error("Approve Subscription API Error:", error);
    throw error;
  }
};

// reject request - User/82/reject-subscription-request
export const rejectSubscription = async (userId: number): Promise<any> => {
  try {
    const response = await client.post(`User/${userId}/reject-subscription-request`);
    return response.data;
  } catch (error) {
    console.error("Reject Subscription API Error:", error);
    throw error;
  }
};


// Approve user : User/unblock/79

export const approveUser = async (userId: number) => {
  try {
    const response = await client.put(`User/unblock/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Unblock User API Error:", error);
    throw error;
  }
};

// block user : User/block/80 

export const blockUser = async (userId: number) => {
  try {
    const response = await client.put(`User/block/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Block User API Error:", error);
    throw error;
  }
};