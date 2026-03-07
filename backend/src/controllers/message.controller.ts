import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Request, Response } from "express";
import { sendMessageSchema } from "../validators/message.validator";
import { HTTPSTATUS } from "../config/http.config";
import { sendMessageService } from "../services/message.service";

export const sendMessageController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id
        console.log("req.user", req.user);
        const body = sendMessageSchema.parse(req.body)
        console.log("req.body", req.body);
        const result = await sendMessageService(userId, body)
        return res.status(HTTPSTATUS.OK).json({
            message: "Gửi tin nhắn thành công",
            ...result,
        })
    }
)