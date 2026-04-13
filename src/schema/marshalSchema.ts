import { z } from "zod";

export const inviteMarshalSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .min(1, "Password is required"),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number must be at most 15 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits")
    .optional()
    .or(z.literal("")),
});

export type InviteMarshalFormData = z.infer<typeof inviteMarshalSchema>;
