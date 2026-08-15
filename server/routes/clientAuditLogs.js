import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

async function canViewAuditLogs(req) {
  const actor =
    await prisma.user.findUnique({
      where: {
        id:
          req.clientUser.userId,
      },
    });

  if (
    !actor ||
    !actor.active ||
    actor.companyId !==
      req.clientUser.companyId
  ) {
    return null;
  }

  if (
    actor.role !==
      "CLIENT_ADMIN" &&
    !actor.canManageSettings &&
    !actor.canManageUsers
  ) {
    return null;
  }

  return actor;
}

router.get("/", async (req, res) => {
  try {
    const actor =
      await canViewAuditLogs(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to view activity logs",
      });
    }

    const companyId =
      req.clientUser.companyId;

    const limit =
      Math.min(
        Math.max(
          Number(req.query.limit) ||
            50,
          1
        ),
        200
      );

    const action =
      String(
        req.query.action || ""
      )
        .trim()
        .toUpperCase();

    const entityType =
      String(
        req.query.entityType || ""
      )
        .trim()
        .toUpperCase();

    const search =
      String(
        req.query.search || ""
      ).trim();

    const where = {
      companyId,
    };

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType =
        entityType;
    }

    if (search) {
      where.OR = [
        {
          summary: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },
        {
          actorName: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },
        {
          actorEmail: {
            contains:
              search,
            mode:
              "insensitive",
          },
        },
      ];
    }

    const [
      logs,
      total,
    ] =
      await Promise.all([
        prisma.auditLog.findMany({
          where,

          orderBy: {
            createdAt:
              "desc",
          },

          take:
            limit,
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

    return res.json({
      success: true,
      total,
      logs,
    });
  } catch (error) {
    console.error(
      "Load audit logs failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load activity logs",
    });
  }
});

export default router;