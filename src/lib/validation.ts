import { z } from "zod";

export const orderInputSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  ticketType: z.enum(["Presale OFC", "General Sale"]),
  sectionCode: z.string().min(1).max(20),
  qty: z.coerce.number().int().min(1).max(4),
  backupSections: z.array(z.string().max(20)).max(10).default([]),
  fullName: z.string().trim().min(3).max(120),
  xUsername: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  whatsapp: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Format nomor tidak valid"),
  nik: z.string().trim().min(6).max(30),
  gender: z.enum(["Laki-laki", "Perempuan"]),
  birthDate: z.string().trim().min(8).max(20),
  paymentMethod: z.enum(["BCA", "GOPAY"]),
  note: z.string().trim().max(1000).optional().default(""),
  website: z.string().max(0).optional().default(""),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});
