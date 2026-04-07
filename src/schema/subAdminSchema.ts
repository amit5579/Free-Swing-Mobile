import { z } from "zod";

export const invitePlayerSchema = z.object({
  username: z.string().min(1, "Name is required"),
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  membershipNo: z.string().min(1, "Membership No. is required"),
  mobileNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  handicap: z.number().min(0, "Handicap must be ≥ 0"),
  handicapIndex: z.number().min(0, "Handicap Index must be ≥ 0"),
});

export type InvitePlayerType = z.infer<typeof invitePlayerSchema>;
