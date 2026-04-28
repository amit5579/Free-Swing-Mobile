import client from "../client";

export interface LoginPayload {
  Email: string;
  Password: string;
}

export interface ForgotPasswordPayload {
  Email: string;
  PhoneNumber: string;
  Password: string;
  ConfirmPassword: string;
}

export interface RegisterPayload {
  Username: string;
  Email: string;
  Password: string;
  MobileNumber: string;
  DateOfBirth?: string | null;
  HomeCourse?: string | null;
  HomeCourseId?: string | null;
  MembershipNo?: string | null;
  TeeBox?: string | null;
  Handicap?: string | null;
  HandicapIndex?: string | null;
  Slope?: string | null;
  Rating?: string | null;
  SubscriptionPlanMonths: number;
}

export const loginUser = async (payload: LoginPayload) => {
  try {
    const response = await client.post(`Auth/login`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Login Error:", error?.response?.data || error.message);
    throw error;
  }
};

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  try {
    const response = await client.post(`Auth/forgot-password`, payload);
    return response.data;
  } catch (error: any) {
    console.error("forgotPassword Error:", error?.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (payload: RegisterPayload) => {
  try {
    const response = await client.post(`Auth/register`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Signup Error:", error?.response?.data || error.message);
    throw error;
  }
};