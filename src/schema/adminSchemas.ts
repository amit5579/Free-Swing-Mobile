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
  upiId: z.string().optional(),
  upiPayeeName: z.string().optional(),
});


export const courseSchema = z.object({
  name: z.string().min(3, "Course Name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  isPremium: z.boolean(),
});


export const teeBoxSchema = z.object({
  name: z.string().min(3, "Tee Box Name must be at least 3 characters"),
  color: z.string().min(3, "Color must be at least 3 characters"),
  rating: z.coerce
    .number()
    .min(0, "Rating must be at least 0")
    .max(100, "Rating cannot exceed 100"),
  slope: z.coerce
    .number()
    .min(50, "Slope must be at least 50")
    .max(155, "Slope cannot exceed 155")
    .int("Slope must be a whole number"),
});

export const tournamentSchema = z
  .object({
    name: z.string().min(3, "Tournament Name must be at least 3 characters"),
    courseId: z.array(z.number()).min(1, "Select a course"),
    teeColor: z.array(z.number()).min(1, "Select a tee color"),
    scoringType: z.array(z.number()).min(1, "Select a scoring type"),
    handicapAllowancePercent: z.number({ message: "Must be a number" })
      .min(0, "Percentage must be at least 0")
      .max(100, "Percentage cannot exceed 100"),
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
  handicapAllowancePercent: z.number({ message: "Must be a number" })
    .min(0, "Percentage must be at least 0")
    .max(100, "Percentage cannot exceed 100"),
  startDate: z.date({ message: "Start Date is required" }),
  endDate: z.date({ message: "End Date is required" }),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export type MiniTournamentType = z.infer<typeof miniTournamentSchema>;

// Add member schema
export const addMemberSchema = z.object({
  username: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  membershipNo: z.string().min(1, "Membership No. is required"),
  mobileNumber: z.string().min(10, "Invalid Phone Number"),
  dateOfBirth: z.string().min(1, "Date of birth is required").refine((val) => {
    const dob = new Date(val);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    const fullYears = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    return fullYears >= 18;
  }, "Member must be at least 18 years old"),
  teeBoxId: z.number().min(1, "Select a tee box"),
  homeCourse: z.string().min(1, "Select a course"),
  homeCourseId: z.number().min(1, "Select a course"),
  handicap: z.preprocess((val) => Number(val), z.number().min(0, "Handicap must be ≥ 0")),
  handicapIndex: z.preprocess((val) => Number(val), z.number().min(0, "Handicap Index must be ≥ 0")),
  courseSlope: z.preprocess((val) => Number(val), z.number().min(0, "Course Slope must be ≥ 0")),
  courseRating: z.preprocess((val) => Number(val), z.number().min(0, "Course Rating must be ≥ 0")),
});

export type AddMemberType = z.infer<typeof addMemberSchema>;