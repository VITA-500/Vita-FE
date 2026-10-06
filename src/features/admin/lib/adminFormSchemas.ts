import { z } from "zod";
import { adminFaqCategories } from "@/features/admin/types";

export const faqFormSchema = z.object({
  answer: z.string().trim().min(1, "답변을 입력해 주세요."),
  category: z.enum(adminFaqCategories, {
    error: "카테고리를 선택해 주세요.",
  }),
  question: z.string().trim().min(1, "질문을 입력해 주세요."),
  subcategory: z.string().optional(),
});

export type FaqFormValues = z.infer<typeof faqFormSchema>;

const coordinateSchema = z
  .string()
  .trim()
  .min(1, "좌표를 입력해 주세요.")
  .refine((value) => Number.isFinite(Number(value)), {
    message: "좌표는 숫자로 입력해 주세요.",
  });
const optionalPattern = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || pattern.test(value), { message });
const businessHoursSchema = optionalPattern(
  /^([01]\d|2[0-3]):[0-5]\d\s*[~-]\s*([01]\d|2[0-3]):[0-5]\d$/,
  "운영시간은 09:00~18:00 형식으로 입력해 주세요.",
);
const phoneSchema = optionalPattern(
  /^0\d{1,2}-\d{3,4}-\d{4}$/,
  "전화번호는 02-1234-5678 형식으로 입력해 주세요.",
);

export const storeFormSchema = z.object({
  address: z.string().trim().min(1, "주소를 입력해 주세요."),
  benefitId: z.string().optional(),
  businessHours: businessHoursSchema,
  consultServices: z.string().optional(),
  lat: coordinateSchema,
  lng: coordinateSchema,
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  phone: phoneSchema,
  providedServices: z.string().optional(),
});

export type StoreFormValues = z.infer<typeof storeFormSchema>;
