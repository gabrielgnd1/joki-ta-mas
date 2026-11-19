import { z } from "zod";

/** Input form order baru (multi-member 2S / MnG). Harga dihitung di server. */
export const jokiOrderInputSchema = z.object({
  items: z
    .array(
      z.object({
        serviceType: z.enum(["2S", "MnG"]),
        team: z.string().trim().min(1).max(40),
        nickname: z.string().trim().min(1).max(40),
        qty: z.coerce.number().int().min(1).max(20),
        sessionNote: z.string().trim().max(120).default(""),
      }),
    )
    .min(1, "Tambahkan minimal 1 member.")
    .max(30),
  customerName: z.string().trim().min(3).max(120),
  accountType: z.enum(["OFC", "Non-OFC"]),
  jktEmail: z.string().trim().email().max(160),
  jktPassword: z.string().min(1).max(200),
  website: z.string().max(0).optional().default(""),
});

export type JokiOrderInput = z.infer<typeof jokiOrderInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});
