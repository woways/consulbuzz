import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireSuperAdmin } from "../middleware/adminAuth.js";
import {
  createSupportTicketUpdatedNotification,
} from "../lib/notifications.js";
import {
  writeSuperAdminAudit,
} from "../lib/adminAuditLog.js";

const router = Router();

router.use(requireSuperAdmin);

const TYPE_LABELS = {
  TECHNICAL_ISSUE:
    "Technical Issue",
  BILLING:
    "Billing Support",
  CUSTOMIZATION:
    "Customization Request",
  FEATURE_REQUEST:
    "Feature Request",
  INTEGRATION:
    "Integration Request",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const STATUS_LABELS = {
  NEW: "New",
  UNDER_REVIEW:
    "Under Review",
  APPROVED: "Approved",
  IN_PROGRESS:
    "In Progress",
  DEVELOPMENT:
    "Development",
  COMPLETED:
    "Completed",
  REJECTED: "Rejected",
  CLOSED: "Closed",
};

const VALID_STATUSES =
  Object.keys(
    STATUS_LABELS
  );

const SUPPORT_TYPES = [
  "TECHNICAL_ISSUE",
  "BILLING",
];

const CUSTOMIZATION_TYPES = [
  "CUSTOMIZATION",
  "FEATURE_REQUEST",
  "INTEGRATION",
];

function getActiveSubscription(
  subscriptions = []
) {
  return (
    subscriptions.find(
      (subscription) =>
        subscription.status ===
          "ACTIVE" ||
        subscription.status ===
          "TRIAL"
    ) ||
    subscriptions[0] ||
    null
  );
}

function formatTicket(ticket) {
  const activeSubscription =
    getActiveSubscription(
      ticket.company?.subscriptions ||
        []
    );

  return {
    id: ticket.id,
    ticketNumber:
      ticket.ticketNumber,
    title: ticket.title,
    description:
      ticket.description,
    type: ticket.type,
    typeLabel:
      TYPE_LABELS[
        ticket.type
      ] || ticket.type,
    priority:
      ticket.priority,
    priorityLabel:
      PRIORITY_LABELS[
        ticket.priority
      ] || ticket.priority,
    status:
      ticket.status,
    statusLabel:
      STATUS_LABELS[
        ticket.status
      ] || ticket.status,
    submittedByName:
      ticket.submittedByName,
    submittedByEmail:
      ticket.submittedByEmail,
    adminRemarks:
      ticket.adminRemarks,
    createdAt:
      ticket.createdAt,
    updatedAt:
      ticket.updatedAt,
    resolvedAt:
      ticket.resolvedAt,

    company: ticket.company
      ? {
          id:
            ticket.company.id,
          name:
            ticket.company.name,
          slug:
            ticket.company.slug,
          brandName:
            ticket.company
              .brandName,
          status:
            ticket.company.status,
          plan:
            activeSubscription
              ?.plan?.key ||
            null,
          planName:
            activeSubscription
              ?.plan?.name ||
            null,
          subscriptionStatus:
            activeSubscription
              ?.status ||
            null,
        }
      : null,
  };
}

async function findTicketUserId(
  companyId,
  email
) {
  if (!email) {
    return null;
  }

  const user =
    await prisma.user.findFirst({
      where: {
        companyId,
        email: String(
          email
        )
          .trim()
          .toLowerCase(),
      },
      select: {
        id: true,
      },
    });

  return user?.id ||
    null;
}

async function getActor(req) {
  return prisma.user.findUnique({
    where: {
      id:
        req.admin.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

router.get("/", async (req, res) => {
  try {
    const status = String(
      req.query.status || ""
    )
      .trim()
      .toUpperCase();

    const type = String(
      req.query.type || ""
    )
      .trim()
      .toUpperCase();

    const companyId = String(
      req.query.companyId || ""
    ).trim();

    const scope = String(
      req.query.scope || ""
    )
      .trim()
      .toLowerCase();

    const where = {};

    if (
      status &&
      VALID_STATUSES.includes(
        status
      )
    ) {
      where.status =
        status;
    }

    if (companyId) {
      where.companyId =
        companyId;
    }

    if (type) {
      where.type =
        type;
    } else if (
      scope === "support"
    ) {
      where.type = {
        in:
          SUPPORT_TYPES,
      };
    } else if (
      scope ===
      "customization"
    ) {
      where.type = {
        in:
          CUSTOMIZATION_TYPES,
      };
    }

    const tickets =
      await prisma.supportTicket.findMany({
        where,
        include: {
          company: {
            include: {
              subscriptions: {
                include: {
                  plan: true,
                },
                orderBy: {
                  createdAt:
                    "desc",
                },
              },
            },
          },
        },
        orderBy: {
          createdAt:
            "desc",
        },
      });

    const formatted =
      tickets.map(
        formatTicket
      );

    const summary = {
      total:
        formatted.length,
      new:
        formatted.filter(
          (ticket) =>
            ticket.status ===
            "NEW"
        ).length,
      underReview:
        formatted.filter(
          (ticket) =>
            ticket.status ===
            "UNDER_REVIEW"
        ).length,
      active:
        formatted.filter(
          (ticket) =>
            [
              "APPROVED",
              "IN_PROGRESS",
              "DEVELOPMENT",
            ].includes(
              ticket.status
            )
        ).length,
      completed:
        formatted.filter(
          (ticket) =>
            [
              "COMPLETED",
              "CLOSED",
            ].includes(
              ticket.status
            )
        ).length,
      customization:
        formatted.filter(
          (ticket) =>
            CUSTOMIZATION_TYPES.includes(
              ticket.type
            )
        ).length,
    };

    return res.json({
      success: true,
      summary,
      tickets:
        formatted,
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin support tickets:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch support tickets",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ticket =
      await prisma.supportTicket.findUnique({
        where: {
          id:
            req.params.id,
        },
        include: {
          company: {
            include: {
              subscriptions: {
                include: {
                  plan: true,
                },
                orderBy: {
                  createdAt:
                    "desc",
                },
              },
            },
          },
        },
      });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message:
          "Support ticket not found",
      });
    }

    return res.json({
      success: true,
      ticket:
        formatTicket(ticket),
    });
  } catch (error) {
    console.error(
      "Failed to fetch support ticket:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch support ticket",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const existing =
      await prisma.supportTicket.findUnique({
        where: {
          id:
            req.params.id,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Support ticket not found",
      });
    }

    const data = {};

    if (
      req.body.status !==
      undefined
    ) {
      const status =
        String(
          req.body.status ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        !VALID_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid support ticket status",
        });
      }

      data.status =
        status;

      if (
        [
          "COMPLETED",
          "CLOSED",
        ].includes(
          status
        )
      ) {
        data.resolvedAt =
          new Date();
      } else {
        data.resolvedAt =
          null;
      }
    }

    if (
      req.body.adminRemarks !==
      undefined
    ) {
      data.adminRemarks =
        req.body
          .adminRemarks
          ? String(
              req.body
                .adminRemarks
            ).trim()
          : null;
    }

    const updated =
      await prisma.supportTicket.update({
        where: {
          id:
            existing.id,
        },
        data,
        include: {
          company: {
            include: {
              subscriptions: {
                include: {
                  plan: true,
                },
                orderBy: {
                  createdAt:
                    "desc",
                },
              },
            },
          },
        },
      });

    const statusChanged =
      data.status !==
        undefined &&
      data.status !==
        existing.status;

    const remarksChanged =
      data.adminRemarks !==
        undefined &&
      data.adminRemarks !==
        existing.adminRemarks;

    if (
      statusChanged ||
      remarksChanged
    ) {
      const targetUserId =
        await findTicketUserId(
          existing.companyId,
          existing
            .submittedByEmail
        );

      await createSupportTicketUpdatedNotification({
        companyId:
          existing.companyId,
        userId:
          targetUserId,
        ticketNumber:
          updated.ticketNumber,
        ticketTitle:
          updated.title,
        statusLabel:
          STATUS_LABELS[
            updated.status
          ] ||
          updated.status,
        adminRemarks:
          updated.adminRemarks,
      });

      const actor =
        await getActor(req);

      await writeSuperAdminAudit({
        req,
        actor,
        action:
          "SUPPORT_TICKET_UPDATED",
        entityType:
          "SUPPORT_TICKET",
        entityId:
          updated.id,
        companyId:
          existing.companyId,
        companyName:
          existing.company
            ?.name ||
          null,
        summary:
          `${actor?.name || "Super Admin"} updated ticket ${updated.ticketNumber} for ${existing.company?.name || "a client"}.`,
        metadata: {
          type:
            updated.type,
          statusBefore:
            existing.status,
          statusAfter:
            updated.status,
          remarksChanged,
        },
      });
    }

    return res.json({
      success: true,
      message:
        "Support ticket updated successfully",
      ticket:
        formatTicket(updated),
    });
  } catch (error) {
    console.error(
      "Failed to update support ticket:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update support ticket",
    });
  }
});

export default router;