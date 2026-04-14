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


export const acceptanceWeiverSchema = z.object({
  isUnder18: z.boolean(),
  parentGuardianMobile: z.string().optional(),
  parentGuardianName: z.string().optional(),
  parentGuardianRelation: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, "You must agree to the terms"),
}).superRefine((data, ctx) => {
  if (data.isUnder18) {
    if (!data.parentGuardianName || data.parentGuardianName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parent Guardian Name must be at least 3 characters",
        path: ["parentGuardianName"],
      });
    }
    if (!data.parentGuardianMobile || data.parentGuardianMobile.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid Phone Number",
        path: ["parentGuardianMobile"],
      });
    }
    if (!data.parentGuardianRelation || data.parentGuardianRelation.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Parent Guardian Relation must be at least 3 characters",
        path: ["parentGuardianRelation"],
      });
    }
  }
});

export type AcceptanceWeiverType = z.infer<typeof acceptanceWeiverSchema>;

export const miniTournamentSchema = z.object({
  name: z.string().min(3, "Tournament Name must be at least 3 characters"),
  courseId: z.number({ message: "Select a course" }).min(1, "Select a course"),
  teeBox: z.number({ message: "Select a tee box" }).min(1, "Select a tee box"),
  scoringType: z.string().min(1, "Select a scoring type"),
  maxPlayers: z.number().min(1, "Select max players"),
  startDate: z.date({ message: "Start Date is required" }),
  endDate: z.date({ message: "End Date is required" }),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type MiniTournamentType = z.infer<typeof miniTournamentSchema>;