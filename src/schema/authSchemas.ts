import { z } from "zod";

// ─── Login Schema ─────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    // .min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Signup Schema (Beginner) ─────────────────────────────────────────────────
const signupBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(3, "Name must be at least 3 characters"),
  dob: z.string().min(1, "Date of Birth is required"),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .min(10, "Mobile number must be at least 10 digits")
    .regex(/^\d+$/, "Mobile number must contain only digits"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

// ─── Signup Schema (Experienced – includes golf stats) ────────────────────────
const signupExperiencedExtension = z.object({
  course: z.string().min(1, "Home Course is required"),
  hcp: z
    .string()
    .min(1, "Handicap is required")
    .regex(/^\d+(\.\d+)?$/, "Handicap must be a valid number"),
  hIndex: z
    .string()
    .min(1, "Handicap Index is required")
    .regex(/^\d+(\.\d+)?$/, "Handicap Index must be a valid number"),
  slope: z
    .string()
    .min(1, "Slope is required")
    .regex(/^\d+(\.\d+)?$/, "Slope must be a valid number"),
  rating: z
    .string()
    .min(1, "Rating is required")
    .regex(/^\d+(\.\d+)?$/, "Rating must be a valid number"),
});

export const signupSchema = z.discriminatedUnion("userType", [
  z.object({
    userType: z.literal("beginner"),
    ...signupBaseSchema.shape,
  }),
  z.object({
    userType: z.literal("experienced"),
    ...signupBaseSchema.shape,
    ...signupExperiencedExtension.shape,
  }),
]);

export type SignupFormData = z.infer<typeof signupSchema>;
