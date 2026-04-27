import { z } from "zod";

export const userTournamentSchema = z
  .object({
    name: z.string().min(3, "Tournament Name must be at least 3 characters"),
    courseId: z.number().min(1, "Select a course"),
    teeBox: z.number().min(1, "Select a tee box"),
    scoringType: z.string().min(1, "Select a scoring type"),
    maxPlayers: z.number().min(1, "Select a max players"),
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



export const contactAdminSchema = z.object({
  category: z
    .string()
    .min(1, "Category is required")
    .refine(
      (val) => ["bug", "improvement", "general"].includes(val),
      "Invalid category"
    ), subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactAdminType = z.infer<typeof contactAdminSchema>;



export const newRoundSchema = z.object({
  teeBoxId: z.number().min(1, "Please select a tee box"),
  scoreType: z.enum(["net_including", "net_excluding", "stableford"], {
    message: "Please select a scoring mode",
  }),
  holesToPlay: z.enum(["18", "front9", "back9"], {
    message: "Please select holes to play",
  }),
});
export type NewRoundFormValues = z.infer<typeof newRoundSchema>;