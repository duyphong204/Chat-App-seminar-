// Socket.io Chat Client
const socket = io();

let currentChatId = null;
let currentuser = null;
let onlineUsers = new Set();

// ========================
// DOM Elements
// ========================
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const searchChat = document.getElementById("searchChat");
const searchUser = document.getElementById("searchUser");
const chatsList = document.getElementById("chatsList");
const usersList = document.getElementById("usersList");
const messagesArea = document.getElementById("messagesArea");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const chatContent = document.getElementById("chatContent");
const chatEmpty = document.querySelector(".chat-empty");
const chatName = document.getElementById("chatName");
const chatStatus = document.getElementById("chatStatus");
const createGroupBtn = document.getElementById("createGroupBtn");
const createGroupModal = document.getElementById("createGroupModal");
const createGroupForm = document.getElementById("createGroupForm");
const userCheckboxList = document.getElementById("userCheckboxList");
const modalClose = document.querySelector(".modal-close");
const btnCancel = document.querySelector(".btn-cancel");

// ========================
// Tab Navigation
// ========================
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(`${targetTab}-tab`).classList.add("active");
  });
});

// ========================
// Socket Events
// ========================

// Kết nối thành công
socket.on("connect", () => {
  console.log("Connected to server");
  loadChats();
  loadUsers();
});

// Nhận danh sách user online
socket.on("online:users", (users) => {
  onlineUsers = new Set(users);
  updateOnlineStatus();
});

// Nhận tin nhắn mới
socket.on("message:new", (message) => {
  if (message.chatId === currentChatId) {
    addMessageToUI(message);
  }
});

// Nhận thông báo khi có chat mới
socket.on("chat:created", (chat) => {
  loadChats();
});

// ========================
// Load Data Functions
// ========================

// Load danh sách chat
async function loadChats() {
  try {
    const response = await fetch("/api/chat/all", {
      credentials: "include",
    });
    const data = await response.json();

    if (data.chats) {
      displayChats(data.chats);
    }
  } catch (error) {
    console.error("Error loading chats:", error);
    chatsList.innerHTML = '<div class="loading">Lỗi khi tải chat</div>';
  }
}

// Load danh sách user
async function loadUsers() {
  try {
    const response = await fetch("/api/user/all", {
      credentials: "include",
    });
    const data = await response.json();

    if (data.users) {
      displayUsers(data.users);
      populateUserCheckbox(data.users);
    }
  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = '<div class="loading">Lỗi khi tải user</div>';
  }
}

// Load tin nhắn trong chat
async function loadMessages(chatId) {
  try {
    const response = await fetch(`/api/chat/${chatId}`, {
      credentials: "include",
    });
    const data = await response.json();

    if (data.chat && data.messages) {
      currentChatId = chatId;
      displayMessages(data.chat, data.messages);

      // Join room chat
      socket.emit("chat:join", chatId, (err) => {
        if (err) console.error(err);
      });
    }
  } catch (error) {
    console.error("Error loading messages:", error);
    messagesArea.innerHTML = '<div class="loading">Lỗi khi tải tin nhắn</div>';
  }
}

// ========================
// Display Functions
// ========================

// Hiển thị danh sách chat
function displayChats(chats) {
  if (chats.length === 0) {
    chatsList.innerHTML =
      '<div class="loading">Chưa có cuộc trò chuyện nào</div>';
    return;
  }

  chatsList.innerHTML = chats
    .map((chat) => {
      const chatTitle = chat.isGroup
        ? chat.groupName
        : chat.participants.find((p) => p._id !== currentuser?._id)?.name ||
          "Chat";
      const lastMessage = chat.lastMessage?.text || "Không có tin nhắn";
      const isOnline = chat.participants.some((p) => onlineUsers.has(p._id));

      return `
            <div class="chat-item" onclick="selectChat('${chat._id}')">
                <div class="avatar">${chatTitle.charAt(0).toUpperCase()}</div>
                <div class="chat-info-item">
                    <div class="chat-name">${chatTitle}</div>
                    <div class="chat-preview">${lastMessage}</div>
                </div>
                ${isOnline ? '<div class="online-badge"></div>' : ""}
            </div>
        `;
    })
    .join("");
}

// Hiển thị danh sách user
function displayUsers(users) {
  if (users.length === 0) {
    usersList.innerHTML = '<div class="loading">Không có user nào</div>';
    return;
  }

  usersList.innerHTML = users
    .map((user) => {
      const isOnline = onlineUsers.has(user._id);
      return `
            <div class="user-item" onclick="startChat('${user._id}', '${user.name}')">
                <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div class="chat-info-item">
                    <div class="user-name">${user.name}</div>
                    <div class="user-status">${isOnline ? "🟢 Online" : "⚫ Offline"}</div>
                </div>
                ${isOnline ? '<div class="online-badge"></div>' : ""}
            </div>
        `;
    })
    .join("");
}

// Hiển thị tin nhắn
function displayMessages(chat, messages) {
  const chatTitle = chat.isGroup
    ? chat.groupName
    : chat.participants.find((p) => p._id !== currentuser?._id)?.name || "Chat";

  chatName.textContent = chatTitle;
  const isOnline = chat.participants.some((p) => onlineUsers.has(p._id));
  chatStatus.textContent = isOnline ? "🟢 Online" : "⚫ Offline";

  messagesArea.innerHTML = messages
    .map((msg) => {
      const senderId =
        typeof msg.sender === "object" ? msg.sender._id : msg.sender;
      return `
        <div class="message ${senderId === currentuser?._id ? "own" : "other"}">
            <div class="message-bubble">
                ${escapeHtml(msg.content || msg.text)}
                <div class="message-time">${formatTime(msg.createdAt)}</div>
            </div>
        </div>
    `;
    })
    .join("");

  // Scroll đến tin nhắn cuối
  messagesArea.scrollTop = messagesArea.scrollHeight;

  // Hiển thị chat window
  chatContent.style.display = "flex";
  chatEmpty.style.display = "none";
}

// Thêm tin nhắn vào UI
function addMessageToUI(message) {
  const messageEl = document.createElement("div");
  const senderId =
    typeof message.sender === "object" ? message.sender._id : message.sender;
  messageEl.className = `message ${senderId === currentuser?._id ? "own" : "other"}`;
  messageEl.innerHTML = `
        <div class="message-bubble">
            ${escapeHtml(message.content || message.text)}
            <div class="message-time">${formatTime(message.createdAt)}</div>
        </div>
    `;

  messagesArea.appendChild(messageEl);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Populate checkbox cho tạo nhóm
function populateUserCheckbox(users) {
  userCheckboxList.innerHTML = users
    .map(
      (user) => `
        <div class="checkbox-item">
            <input type="checkbox" name="participant" value="${user._id}" id="user-${user._id}">
            <label for="user-${user._id}">${user.name}</label>
        </div>
    `,
    )
    .join("");
}

// ========================
// Actions
// ========================

// Chọn chat
function selectChat(chatId) {
  loadMessages(chatId);

  // Highlight active chat
  document.querySelectorAll(".chat-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.closest(".chat-item").classList.add("active");
}

// Bắt đầu chat với user
async function startChat(userId, userName) {
  try {
    const response = await fetch("/api/chat/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ participantId: userId }),
      credentials: "include",
    });
    const data = await response.json();

    if (data.chat) {
      loadChats();
      loadMessages(data.chat._id);
    }
  } catch (error) {
    console.error("Error creating chat:", error);
  }
}

// Gửi tin nhắn
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const messageText = messageInput.value.trim();
  if (!messageText) return;

  try {
    const response = await fetch("/api/chat/message/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId: currentChatId,
        content: messageText,
      }),
      credentials: "include",
    });
    const data = await response.json();

    if (data.userMessage) {
      // Thêm tin nhắn vào UI ngay lập tức
      addMessageToUI(data.userMessage);
      messageInput.value = "";

      // Emit socket event để thông báo cho các user khác
      socket.emit("message:send", {
        chatId: currentChatId,
        message: data.userMessage,
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
});

// Tạo nhóm
createGroupBtn.addEventListener("click", () => {
  createGroupModal.style.display = "flex";
});

modalClose.addEventListener("click", () => {
  createGroupModal.style.display = "none";
});

btnCancel.addEventListener("click", () => {
  createGroupModal.style.display = "none";
});

createGroupModal.addEventListener("click", (e) => {
  if (e.target === createGroupModal) {
    createGroupModal.style.display = "none";
  }
});

createGroupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const groupName = document.getElementById("groupName").value.trim();
  const participants = Array.from(
    userCheckboxList.querySelectorAll('input[name="participant"]:checked'),
  ).map((cb) => cb.value);

  if (!groupName || participants.length === 0) {
    alert("Vui lòng nhập tên nhóm và chọn thành viên");
    return;
  }

  try {
    const response = await fetch("/api/chat/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupName,
        participants,
        isGroup: true,
      }),
      credentials: "include",
    });
    const data = await response.json();

    if (data.chat) {
      loadChats();
      createGroupModal.style.display = "none";
      createGroupForm.reset();
    }
  } catch (error) {
    console.error("Error creating group:", error);
    alert("Lỗi khi tạo nhóm");
  }
});

// Tìm kiếm chat
searchChat.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".chat-item").forEach((item) => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    item.style.display = name.includes(query) ? "flex" : "none";
  });
});

// Tìm kiếm user
searchUser.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".user-item").forEach((item) => {
    const name = item.querySelector(".user-name").textContent.toLowerCase();
    item.style.display = name.includes(query) ? "flex" : "none";
  });
});

// ========================
// Utilities
// ========================

function updateOnlineStatus() {
  displayChats(
    Array.from(document.querySelectorAll(".chat-item")).map((item) => ({
      _id: item.onclick.toString().match(/'([^']+)'/)[1],
    })),
  );
}

function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Get current user từ page load
async function getCurrentUser() {
  try {
    const response = await fetch("/api/auth/status", {
      credentials: "include",
    });
    const data = await response.json();
    if (data.user) {
      currentuser = data.user;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
  }
}

// Initialize
getCurrentUser();
