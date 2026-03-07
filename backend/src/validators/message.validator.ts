import { z } from 'zod'
export const sendMessageSchema = z.object({
    chatId: z.string().trim().min(1),
    content: z.string().trim().optional(),
    image: z.string().trim().optional(),
    replyToId: z.string().trim().optional(),
})
    .refine((data) => data.content || data.image, {
        message: "Nội dung hoặc hình ảnh là bắt buộc",
        path: ["content"],  // Hiển thị lỗi ở input content
    })