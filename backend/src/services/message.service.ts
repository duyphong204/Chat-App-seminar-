import cloudinary from "../config/cloudinary.config";
import { emitLastMessageToParticipants, emitNewMessageToChatRoom } from "../lib/socket";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import { BadRequestException, NotFoundException } from "../utils/app-error";
import mongoose from "mongoose";
export const sendMessageService = async (
  userId: string,
  body: {
    chatId: string;
    content?: string;
    image?: string;
    replyToId?: string;
  }
) => {
  const { chatId, content, image, replyToId } = body;

  // Kiểm tra chat tồn tại & user có quyền
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });
  if (!chat) throw new BadRequestException("Không tìm thấy cuộc trò chuyện hoặc không có quyền");

  // Nếu là trả lời tin nhắn, kiểm tra tin nhắn gốc tồn tại
  if (replyToId) {
    const replyMessage = await MessageModel.findOne({
      _id: replyToId,
      chatId,
    });
    if (!replyMessage) throw new NotFoundException("Không tìm thấy tin nhắn trả lời");
  }

  // Upload ảnh lên Cloudinary nếu có
  let imageUrl;
  if (image) {
    const uploadRes = await cloudinary.uploader.upload(image)
    imageUrl = uploadRes.secure_url
  }

  // Tạo tin nhắn mới
  const newMessage = await MessageModel.create({
    chatId,
    sender: userId,
    content,
    image: imageUrl,
    replyTo: replyToId || null,
  });

  // Populate dữ liệu trả về client
  await newMessage.populate([
    { path: "sender", select: "name avatar" }, // Thông tin người gửi
    {
      path: "replyTo",                          // Nếu là trả lời
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    },
  ]);

  // WebSocket

  // Cập nhật tin nhắn cuối cùng (lastMessage) cho cuộc chat
  chat.lastMessage = newMessage._id as mongoose.Types.ObjectId;
  await chat.save();

  // Gửi (emit) tin nhắn mới đến phòng chat (trừ người gửi)
  emitNewMessageToChatRoom(userId, chatId, newMessage);

  // Lấy danh sách tất cả ID của thành viên trong chat (dạng string)
  const allParticipantIds = chat.participants.map((id) => id.toString());

  // Gửi (emit) tin nhắn cuối cùng đến từng người trong phòng riêng (user room)
  emitLastMessageToParticipants(allParticipantIds, chatId, newMessage);

  // Trả về message vừa tạo và chat
  return { userMessage: newMessage, chat };
};
