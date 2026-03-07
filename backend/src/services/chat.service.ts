import { emitNewChatToParticpants } from "../lib/socket";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import { BadRequestException } from "../utils/app-error";

export const createChatService = async (
  userId: string,
  body: {
    participantId?: string;
    isGroup?: boolean;
    participants?: string[]; // danh sách id người tham gia group
    groupName?: string;
  }) => {
  const { participantId, isGroup, participants, groupName } = body

  let chat;
  let allParticipantIds: string[] = []
  // Tạo group chat
  if (isGroup && participants?.length && groupName) {
    // Bao gồm creator + các participants
    allParticipantIds = [userId, ...participants]
    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: true,
      groupName,
      createdBy: userId,
    })
    // Tạo chat 1-1
  } else if (participantId) {
    const otherUser = await UserModel.findById(participantId)
    if (!otherUser) throw new BadRequestException("Không tìm thấy người dùng")

    allParticipantIds = [userId, participantId]
    const existingChat = await ChatModel.findOne({
      participants: { $all: allParticipantIds, $size: 2 }
    }).populate("participants", "name avatar")

    if (existingChat) return existingChat

    chat = await ChatModel.create({
      participants: allParticipantIds,
      isGroup: false,
      createdBy: userId
    })
  }

  const populatedChat = await chat?.populate("participants", "name avatar isAI");
  // Chuyển _id của từng participant thành chuỗi (string)
  const particpantIdStrings = populatedChat?.participants?.map((p) => {
    return p._id?.toString();
  });
  // Gửi sự kiện "chat:new" đến tất cả thành viên của chat
  emitNewChatToParticpants(particpantIdStrings, populatedChat);
  return chat
}

export const getUserChatsService = async (userId: string) => {
  // Lấy tất cả chat mà userId tham gia
  const chats = ChatModel.find({
    participants: { $in: [userId] } // tìm các chat mà mảng participants chứa userId
  })
    .populate("participants", "name avatar")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    })
    .sort({ updatedAt: -1 });
  return chats
};

export const getSingleChatService = async (chatId: string, userId: string) => {
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: {
      $in: [userId],
    },
  }).populate("participants", "name avatar");

  if (!chat)
    throw new BadRequestException(
      "Không tìm thấy cuộc trò chuyện hoặc bạn không có quyền xem"
    );

  const messages = await MessageModel.find({ chatId })
    .populate("sender", "name avatar")
    .populate({
      path: "replyTo",
      select: "content image sender",
      populate: {
        path: "sender",
        select: "name avatar",
      },
    }).sort({ createdAt: 1 });

  return {
    chat,
    messages,
  };
}

// Kiểm tra xem user có nằm trong danh sách thành viên của chat không
export const validateChatParticipant = async (chatId: string, userId: string) => {
  // Tìm chat có _id khớp và chứa userId trong participants
  const chat = await ChatModel.findOne({
    _id: chatId,
    participants: { $in: [userId] },
  });

  if (!chat) throw new BadRequestException("Người dùng không phải là thành viên của cuộc trò chuyện");
  return chat; // Trả về chat hợp lệ
};
