import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { validateChatParticipant } from "../services/chat.service";

// socket có thêm thuộc tính userId
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

// lưu userId và socketId tương ứng
const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // middleware xác thực JWT
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("Không được phép"));

      const token = rawCookie
        .split(";")
        .find((c) => c.trim().startsWith("accessToken="))
        ?.split("=")[1]
        ?.trim();

      if (!token) return next(new Error("Không được phép"));

      const decodedToken = jwt.verify(token, Env.JWT_SECRET) as { userId: string };
      if (!decodedToken) return next(new Error("Không được phép"));

      socket.userId = decodedToken.userId;
      next();
    } catch (error) {
      next(new Error("Lỗi máy chủ nội bộ"));
    }
  });

  // khi client kết nối
  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const newSocketId = socket.id;

    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    // lưu user online
    onlineUsers.set(userId, newSocketId);

    // gửi danh sách user online cho tất cả client
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    // tạo phòng riêng cho user
    socket.join(`user:${userId}`);

    // khi user tham gia phòng chat
    socket.on("chat:join", async (chatId: string, callback?: (err?: string) => void) => {
      try {
        await validateChatParticipant(chatId, userId);
        socket.join(`chat:${chatId}`);
        console.log(`User ${userId} join room chat:${chatId}`);
        callback?.();
      } catch (error) {
        callback?.("Lỗi khi tham gia cuộc trò chuyện");
      }
    });

    // khi user rời phòng chat
    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    // khi user disconnect
    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        onlineUsers.delete(userId);
        io?.emit("online:users", Array.from(onlineUsers.keys()));
        console.log("socket disconnected", { userId, newSocketId });
      }
    });
  });
};

// lấy đối tượng io hiện tại
function getIO() {
  if (!io) throw new Error("Socket.IO chưa được khởi tạo");
  return io;
}

// gửi sự kiện tạo chat mới đến các thành viên
export const emitNewChatToParticpants = (participantIds: string[] = [], chat: any) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

// gửi tin nhắn mới đến phòng chat (trừ người gửi)
export const emitNewMessageToChatRoom = (
  senderId: string,
  chatId: string,
  message: any
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, "senderId");
  console.log(senderSocketId, "sender socketid exist");
  console.log("All online users:", Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
};

// gửi tin nhắn cuối cùng đến tất cả người trong chat
export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};
