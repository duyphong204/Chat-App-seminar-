import { z } from 'zod';

export const emailSchema = z.string().trim().email('Địa chỉ email không hợp lệ').min(1, 'Email là bắt buộc');
export const passwordSchema = z.string().trim().min(1, 'Mật khẩu là bắt buộc');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Tên là bắt buộc'),
  email: emailSchema,
  password: passwordSchema,
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/* Kiểu TypeScript suy luận tự động từ Zod schema */
export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;