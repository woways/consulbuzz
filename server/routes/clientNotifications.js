import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

function notificationWhere(req) {
  return {
    companyId: req.clientUser.companyId,
    OR: [
      { userId: null },
      { userId: req.clientUser.userId },
    ],
  };
}

async function getWorkspaceDefaults(companyId) {
  const settings =
    await prisma.companySettings.findUnique({
      where: {
        companyId,
      },
      select: {
        emailNotifications: true,
        smsNotifications: true,
      },
    });

  return {
    emailEnabled:
      settings?.emailNotifications ?? true,
    smsEnabled:
      settings?.smsNotifications ?? false,
  };
}

async function getUserPreference(
  companyId,
  userId
) {
  const [
    preference,
    workspaceDefaults,
  ] = await Promise.all([
    prisma.userNotificationPreference.findUnique({
      where: {
        userId,
      },
    }),
    getWorkspaceDefaults(companyId),
  ]);

  return {
    workspaceDefaults,

    preference: {
      inAppEnabled:
        preference?.inAppEnabled ?? true,

      emailEnabled:
        preference?.emailEnabled ??
        workspaceDefaults.emailEnabled,

      smsEnabled:
        preference?.smsEnabled ??
        workspaceDefaults.smsEnabled,

      leadUpdates:
        preference?.leadUpdates ?? true,

      admissionUpdates:
        preference?.admissionUpdates ?? true,

      billingUpdates:
        preference?.billingUpdates ?? true,

      supportUpdates:
        preference?.supportUpdates ?? true,

      systemUpdates:
        preference?.systemUpdates ?? true,
    },
  };
}

router.get(
  "/preferences",
  async (req, res) => {
    try {
      const data =
        await getUserPreference(
          req.clientUser.companyId,
          req.clientUser.userId
        );

      return res.json({
        success: true,
        ...data,
      });
    } catch (error) {
      console.error(
        "Load notification preferences failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load notification preferences",
      });
    }
  }
);

router.patch(
  "/preferences",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const userId =
        req.clientUser.userId;

      const allowedFields = [
        "inAppEnabled",
        "emailEnabled",
        "smsEnabled",
        "leadUpdates",
        "admissionUpdates",
        "billingUpdates",
        "supportUpdates",
        "systemUpdates",
      ];

      const data = {};

      for (const field of allowedFields) {
        if (
          typeof req.body?.[field] ===
          "boolean"
        ) {
          data[field] =
            req.body[field];
        }
      }

      await prisma.userNotificationPreference.upsert({
        where: {
          userId,
        },
        update: {
          ...data,
          companyId,
        },
        create: {
          companyId,
          userId,
          ...data,
        },
      });

      const result =
        await getUserPreference(
          companyId,
          userId
        );

      return res.json({
        success: true,
        message:
          "Notification preferences saved",
        ...result,
      });
    } catch (error) {
      console.error(
        "Save notification preferences failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save notification preferences",
      });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1
      ),
      50
    );

    const where =
      notificationWhere(req);

    const [notifications, unreadCount] =
      await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          take: limit,
        }),

        prisma.notification.count({
          where: {
            ...where,
            read: false,
          },
        }),
      ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Load client notifications failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load notifications",
    });
  }
});

router.get(
  "/unread-count",
  async (req, res) => {
    try {
      const unreadCount =
        await prisma.notification.count({
          where: {
            ...notificationWhere(req),
            read: false,
          },
        });

      return res.json({
        success: true,
        unreadCount,
      });
    } catch (error) {
      console.error(
        "Load unread notification count failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load notification count",
      });
    }
  }
);

router.patch(
  "/read-all",
  async (req, res) => {
    try {
      const result =
        await prisma.notification.updateMany({
          where: {
            ...notificationWhere(req),
            read: false,
          },
          data: {
            read: true,
            readAt:
              new Date(),
          },
        });

      return res.json({
        success: true,
        updated: result.count,
      });
    } catch (error) {
      console.error(
        "Mark all notifications read failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to mark notifications as read",
      });
    }
  }
);

router.patch(
  "/:id/read",
  async (req, res) => {
    try {
      const notification =
        await prisma.notification.findFirst({
          where: {
            id: req.params.id,
            ...notificationWhere(req),
          },
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      const updated =
        notification.read
          ? notification
          : await prisma.notification.update({
              where: {
                id: notification.id,
              },
              data: {
                read: true,
                readAt:
                  new Date(),
              },
            });

      return res.json({
        success: true,
        notification: updated,
      });
    } catch (error) {
      console.error(
        "Mark notification read failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update notification",
      });
    }
  }
);

export default router;