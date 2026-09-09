import { Router } from "express";
import crypto from "crypto";

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
function formatConversation(conversation, currentUserId, unreadCount = 0) {
  const others = conversation.members
    .map((m) => m.user)
    .filter((u) => u && u.id !== currentUserId);

  const myMembership = conversation.members.find(
    (m) => m.userId === currentUserId
  );

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
    unreadCount,
    isFavorite: Boolean(myMembership?.isFavorite),
    isMuted: Boolean(myMembership?.isMuted),
    isArchived: Boolean(myMembership?.isArchived),
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

    const me = req.clientUser.userId;

    // Compute unread counts: messages after my lastReadAt, not sent by me.
    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const myMembership = c.members.find((m) => m.userId === me);
        const lastReadAt = myMembership?.lastReadAt || null;

        const unreadCount = await prisma.chatMessage.count({
          where: {
            conversationId: c.id,
            senderId: { not: me },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return formatConversation(c, me, unreadCount);
      })
    );

    return res.json({
      success: true,
      conversations: withUnread,
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
        replyTo: {
          include: {
            sender: { select: { id: true, name: true, email: true } },
          },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Return oldest-first for rendering.
    const ordered = messages.reverse().map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      body: m.body,
      pinned: m.pinned,
      createdAt: m.createdAt,
      sender: userMini(m.sender),
      replyTo: m.replyTo
        ? { id: m.replyTo.id, body: m.replyTo.body, sender: userMini(m.replyTo.sender) }
        : null,
      reactions: (m.reactions || []).map((r) => ({
        id: r.id,
        emoji: r.emoji,
        user: userMini(r.user),
      })),
      attachments: (m.attachments || []).map((a) => ({
        id: a.id,
        url: a.url,
        publicId: a.publicId,
        resourceType: a.resourceType,
        fileName: a.fileName,
        mimeType: a.mimeType,
        size: a.size,
        width: a.width,
        height: a.height,
      })),
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

/* ------------------------------------------------------------------ */
/* PATCH /:id/favorite — toggle favorite for the current user          */
/* ------------------------------------------------------------------ */

router.patch("/:id/favorite", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const isFavorite = Boolean(req.body?.isFavorite);

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
    });
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
      data: { isFavorite },
    });

    return res.json({ success: true, isFavorite });
  } catch (error) {
    console.error("Toggle favorite failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update favorite" });
  }
});

/* ------------------------------------------------------------------ */
/* PATCH /:id/mute — toggle mute for the current user                  */
/* ------------------------------------------------------------------ */

router.patch("/:id/mute", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const isMuted = Boolean(req.body?.isMuted);

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
    });
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
      data: { isMuted },
    });

    return res.json({ success: true, isMuted });
  } catch (error) {
    console.error("Toggle mute failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update mute" });
  }
});


/* ------------------------------------------------------------------ */
/* PATCH /:id/archive — archive/unarchive for the current user         */
/* ------------------------------------------------------------------ */

router.patch("/:id/archive", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const isArchived = Boolean(req.body?.isArchived);

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
    });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found" });
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.clientUser.userId,
        },
      },
      data: { isArchived },
    });

    return res.json({ success: true, isArchived });
  } catch (error) {
    console.error("Toggle archive failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update archive" });
  }
});

/* ------------------------------------------------------------------ */
/* PATCH /messages/:messageId/pin — toggle a message's pinned state     */
/* ------------------------------------------------------------------ */

router.patch("/messages/:messageId/pin", async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const pinned = Boolean(req.body?.pinned);

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (
      !message ||
      message.conversation.companyId !== req.clientUser.companyId
    ) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    // Must be a member of the conversation to pin.
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: message.conversationId,
          userId: req.clientUser.userId,
        },
      },
    });
    if (!member) {
      return res
        .status(403)
        .json({ success: false, message: "Not a member" });
    }

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { pinned },
    });

    return res.json({ success: true, pinned });
  } catch (error) {
    console.error("Toggle pin failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update pin" });
  }
});


/* ------------------------------------------------------------------ */
/* POST /upload-signature — signed direct upload to Cloudinary         */
/* ------------------------------------------------------------------ */

router.post("/upload-signature", async (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: "Cloudinary is not configured" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `consulbuzz/chat/${req.clientUser.companyId}`;
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    return res.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
    });
  } catch (error) {
    console.error("Cloudinary signature failed:", error);
    return res.status(500).json({ success: false, message: "Unable to prepare upload" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /messages/:messageId — sender can delete own message         */
/* ------------------------------------------------------------------ */

router.delete("/messages/:messageId", async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const me = req.clientUser.userId;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { conversation: true, attachments: true },
    });

    if (!message || message.conversation.companyId !== req.clientUser.companyId) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    if (message.senderId !== me) {
      return res.status(403).json({ success: false, message: "You can delete only your own messages" });
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });
    return res.json({ success: true, messageId, conversationId: message.conversationId });
  } catch (error) {
    console.error("Delete message failed:", error);
    return res.status(500).json({ success: false, message: "Unable to delete message" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /:id — delete direct chat or creator-owned group             */
/* ------------------------------------------------------------------ */

router.delete("/:id", async (req, res) => {
  try {
    const conversationId = req.params.id;
    const me = req.clientUser.userId;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });

    if (!conversation || conversation.companyId !== req.clientUser.companyId) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const isMember = conversation.members.some((m) => m.userId === me);
    if (!isMember) {
      return res.status(403).json({ success: false, message: "Not a member" });
    }

    if (conversation.isGroup && conversation.createdByUserId !== me) {
      return res.status(403).json({ success: false, message: "Only the group creator can delete this group" });
    }

    await prisma.conversation.delete({ where: { id: conversationId } });
    return res.json({ success: true, conversationId });
  } catch (error) {
    console.error("Delete conversation failed:", error);
    return res.status(500).json({ success: false, message: "Unable to delete conversation" });
  }
});


export default router;