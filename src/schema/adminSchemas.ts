import { z } from "zod";

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


