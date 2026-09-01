import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function userMini(user) {
  return user
    ? { id: user.id, name: user.name, email: user.email }
    : null;
}

// Shape a conversation for the list: for 1-to-1, the "title" is the other
// person's name; for a group, the group name.
function formatConversation(conversation, currentUserId) {
  const others = conversation.members
    .map((m) => m.user)
    .filter((u) => u && u.id !== currentUserId);

  const title = conversation.isGroup
    ? conversation.name || "Group chat"
    : others[0]?.name || "Conversation";

  const lastMessage = conversation.messages?.[0]
    ? {
        id: conversation.messages[0].id,
        body: conversation.messages[0].body,
        createdAt: conversation.messages[0].createdAt,
        senderId: conversation.messages[0].senderId,
      }
    : null;

  return {
    id: conversation.id,
    isGroup: conversation.isGroup,
    name: conversation.name,
    title,
    members: conversation.members.map((m) => userMini(m.user)),
    otherMembers: others.map(userMini),
    lastMessage,
    updatedAt: conversation.updatedAt,
  };
}

/* ------------------------------------------------------------------ */
/* GET /users — company users you can start a chat with                */
/* ------------------------------------------------------------------ */

router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        companyId: req.clientUser.companyId,
        active: true,
        id: { not: req.clientUser.userId },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, users });
  } catch (error) {
    console.error("Failed to fetch chat users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch users" });
  }
});

/* ------------------------------------------------------------------ */
/* GET / — my conversations, most-recent first                         */
/* ------------------------------------------------------------------ */

router.get("/", async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        companyId: req.clientUser.companyId,
        members: { some: { userId: req.clientUser.userId } },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.json({
      success: true,
      conversations: conversations.map((c) =>
        formatConversation(c, req.clientUser.userId)
      ),
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch conversations" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /:id/messages — paginated messages for a conversation           */
/* ------------------------------------------------------------------ */

router.get("/:id/messages", async (req, res) => {
  try {
    const conversationId = req.params.id;

    // Membership + company check.
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
      include: { conversation: true },
    });

    if (
      !member ||
      member.conversation.companyId !== req.clientUser.companyId
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const before = req.query.before
      ? new Date(String(req.query.before))
      : null;

    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Return oldest-first for rendering.
    const ordered = messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      body: m.body,
      createdAt: m.createdAt,
      sender: userMini(m.sender),
    }));

    // Mark as read up to now.
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return res.json({ success: true, messages: ordered });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch messages" });
  }
});

/* ------------------------------------------------------------------ */
/* POST / — create a conversation (1-to-1 or group)                    */
/* ------------------------------------------------------------------ */

router.post("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const me = req.clientUser.userId;

    const isGroup = Boolean(req.body?.isGroup);
    const name = String(req.body?.name || "").trim();
    const memberIds = Array.isArray(req.body?.memberIds)
      ? req.body.memberIds.filter((id) => typeof id === "string")
      : [];

    if (memberIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Select at least one member" });
    }

    if (isGroup && !name) {
      return res
        .status(400)
        .json({ success: false, message: "Group name is required" });
    }

    // Verify all selected members belong to the same company.
    const validMembers = await prisma.user.findMany({
      where: {
        id: { in: memberIds },
        companyId,
        active: true,
      },
      select: { id: true },
    });

    if (validMembers.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid members selected" });
    }

    const allMemberIds = Array.from(
      new Set([me, ...validMembers.map((u) => u.id)])
    );

    // For 1-to-1, reuse an existing conversation between the two users.
    if (!isGroup && allMemberIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          companyId,
          isGroup: false,
          AND: allMemberIds.map((uid) => ({
            members: { some: { userId: uid } },
          })),
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      if (existing && existing.members.length === 2) {
        return res.json({
          success: true,
          conversation: formatConversation(existing, me),
          existed: true,
        });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        companyId,
        isGroup,
        name: isGroup ? name : null,
        createdByUserId: me,
        members: {
          create: allMemberIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return res.json({
      success: true,
      conversation: formatConversation(conversation, me),
      existed: false,
    });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create conversation" });
  }
});

export default router;