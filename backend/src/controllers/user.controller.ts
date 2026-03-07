import { Request, Response } from "express";
import UserModel from "../models/user.model";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { getUsersService } from "../services/user.service";
import { HTTPSTATUS } from "../config/http.config";

export const getUsersController = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?._id
        const users = await getUsersService(userId)
        return res.status(HTTPSTATUS.OK).json({
            message: "Lấy danh sách người dùng thành công",
            users
        })
    }
)