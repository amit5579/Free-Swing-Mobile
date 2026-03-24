import { z } from "zod";

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Min 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


export const subAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.email("Enter a valid Email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobileNumber: z.string().min(10, "Invalid Phone Number"),
  courseIds: z.array(z.number()).min(1, "Select at least one course"),
});


export const courseSchema = z.object({
  name: z.string().min(3, "Course Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  isPremium: z.boolean(),
});


export const teeBoxSchema = z.object({
  name: z.string().min(3, "Tee Box Name must be at least 3 characters"),
  color: z.string().min(3, "Color must be at least 3 characters"),
  rating: z.number(),
  slope: z.number()
});

export const tournamentSchema = z
  .object({
    name: z.string().min(3, "Tournament Name must be at least 3 characters"),
    courseId: z.array(z.number()).min(1, "Select a course"),
    teeColor: z.array(z.number()).min(1, "Select a tee color"),
    scoringType: z.array(z.number()).min(1, "Select a scoring type"),
    description: z.string().optional(),
    startDate: z.date().nullable().refine((val) => val !== null, {
      message: "Start Date is required",
    }),

    endDate: z.date().nullable().refine((val) => val !== null, {
      message: "End Date is required",
    }),
  })
  .refine((data) => {
    if (!data.startDate || !data.endDate) return true;
    return data.endDate >= data.startDate;
  }, {
    message: "End date must be after start date",
    path: ["endDate"],
  })
