import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

import prisma from "./lib/prisma.js";

const COOKIE_NAME = "cb_client_token";

// Minimal cookie-header parser (avoids an extra dependency).
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

// Parse + verify the same client cookie the REST auth uses.
function authenticateSocket(socket) {
  try {
    const raw = socket.handshake.headers.cookie || "";
    const parsed = parseCookies(raw);
    const token = parsed[COOKIE_NAME];
    if (!token) return null;

    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      !payload ||
      typeof payload !== "object" ||
      !payload.sub ||
      !payload.companyId ||
      payload.role === "SUPER_ADMIN"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      companyId: payload.companyId,
    };
  } catch (error) {
    return null;
  }
}

export function attachSocketServer(httpServer, config) {
  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin(origin, callback) {
        if (!origin || config.clientOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
    },
  });

  // Authenticate every connection.
  io.use((socket, next) => {
    const auth = authenticateSocket(socket);
    if (!auth) {
      return next(new Error("Unauthorized"));
    }
    socket.data.userId = auth.userId;
    socket.data.companyId = auth.companyId;
    next();
  });

  io.on("connection", (socket) => {
    const { userId, companyId } = socket.data;

    // Personal room — lets us push to a specific user regardless of which
    // conversations they currently have open.
    socket.join(`user:${userId}`);

    // Client asks to join a conversation's room (must be a member).
    socket.on("conversation:join", async (conversationId) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: String(conversationId),
              userId,
            },
          },
        });
        if (member) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (error) {
        console.error("conversation:join failed:", error);
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send a message: persist, then broadcast to the room + members' personal rooms.
    socket.on("message:send", async (data, ack) => {
      try {
        const conversationId = String(data?.conversationId || "");
        const body = String(data?.body || "").trim();
        if (!conversationId || !body) {
          if (typeof ack === "function") ack({ ok: false, error: "Invalid message" });
          return;
        }
        if (body.length > 4000) {
          if (typeof ack === "function") ack({ ok: false, error: "Message too long" });
          return;
        }

        // Verify membership + company scope.
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: { conversationId, userId },
          },
          include: { conversation: true },
        });

        if (!member || member.conversation.companyId !== companyId) {
          if (typeof ack === "function") ack({ ok: false, error: "Not a member" });
          return;
        }

        const message = await prisma.chatMessage.create({
          data: { conversationId, senderId: userId, body },
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        });

        // Bump conversation's updatedAt so lists sort by recent activity.
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        const payload = {
          id: message.id,
          conversationId,
          body: message.body,
          createdAt: message.createdAt,
          sender: message.sender,
        };

        // Broadcast to anyone currently in the conversation room.
        io.to(`conversation:${conversationId}`).emit("message:new", payload);

        // Also notify all members' personal rooms (for unread badges / list bump),
        // even if they don't have this conversation open.
        const members = await prisma.conversationMember.findMany({
          where: { conversationId },
          select: { userId: true },
        });
        members.forEach((m) => {
          io.to(`user:${m.userId}`).emit("conversation:activity", {
            conversationId,
            lastMessage: payload,
          });
        });

        if (typeof ack === "function") ack({ ok: true, message: payload });
      } catch (error) {
        console.error("message:send failed:", error);
        if (typeof ack === "function") ack({ ok: false, error: "Server error" });
      }
    });

    socket.on("disconnect", () => {
      // Rooms are cleaned up automatically by Socket.IO.
    });
  });

  return io;
}