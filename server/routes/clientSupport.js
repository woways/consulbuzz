import {
  Router,
} from "express";

import prisma from "../lib/prisma.js";

import {
  requireClientUser,
} from "../middleware/clientAuth.js";

import {
  createSupportTicketCreatedNotification,
} from "../lib/notifications.js";

const router =
  Router();

router.use(
  requireClientUser
);

const TYPE_LABELS = {
  TECHNICAL_ISSUE:
    "Technical Issue",

  BILLING:
    "Billing Support",

  CUSTOMIZATION:
    "Customization Request",

  FEATURE_REQUEST:
    "Customization Request",

  INTEGRATION:
    "Customization Request",
};

const PRIORITY_LABELS = {
  LOW:
    "Low",

  MEDIUM:
    "Medium",

  HIGH:
    "High",

  URGENT:
    "Urgent",
};

const STATUS_LABELS = {
  NEW:
    "New",

  UNDER_REVIEW:
    "Under Review",

  APPROVED:
    "Approved",

  IN_PROGRESS:
    "In Progress",

  DEVELOPMENT:
    "Development",

  COMPLETED:
    "Completed",

  REJECTED:
    "Rejected",

  CLOSED:
    "Closed",
};

const VALID_NEW_TYPES = [
  "TECHNICAL_ISSUE",
  "BILLING",
  "CUSTOMIZATION",
];

const VALID_PRIORITIES =
  Object.keys(
    PRIORITY_LABELS
  );

function formatTicket(
  ticket
) {
  return {
    id:
      ticket.id,

    ticketNumber:
      ticket.ticketNumber,

    title:
      ticket.title,

    description:
      ticket.description,

    type:
      ticket.type,

    typeLabel:
      TYPE_LABELS[
        ticket.type
      ] ||
      ticket.type,

    priority:
      ticket.priority,

    priorityLabel:
      PRIORITY_LABELS[
        ticket.priority
      ] ||
      ticket.priority,

    status:
      ticket.status,

    statusLabel:
      STATUS_LABELS[
        ticket.status
      ] ||
      ticket.status,

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
  };
}

async function generateTicketNumber() {
  const year =
    new Date()
      .getFullYear();

  const count =
    await prisma
      .supportTicket
      .count();

  return `T-${year}-${String(
    count + 1
  ).padStart(
    5,
    "0"
  )}`;
}

async function getCurrentPlan(
  companyId
) {
  const subscription =
    await prisma
      .subscription
      .findFirst({
        where: {
          companyId,

          status: {
            in: [
              "ACTIVE",
              "TRIAL",
            ],
          },
        },

        include: {
          plan:
            true,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

  return (
    subscription
      ?.plan
      ?.key ||
    null
  );
}

router.get(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const tickets =
        await prisma
          .supportTicket
          .findMany({
            where: {
              companyId,
            },

            orderBy: {
              createdAt:
                "desc",
            },
          });

      return res.json({
        success:
          true,

        tickets:
          tickets.map(
            formatTicket
          ),
      });
    } catch (error) {
      console.error(
        "Failed to fetch support tickets:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to fetch support tickets",
        });
    }
  }
);

router.post(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const userId =
        req.clientUser
          .userId;

      const user =
        await prisma
          .user
          .findUnique({
            where: {
              id:
                userId,
            },

            select: {
              name:
                true,

              email:
                true,
            },
          });

      const {
        title,
        description,
        type,
        priority,
      } =
        req.body ||
        {};

      const cleanTitle =
        String(
          title ||
            ""
        ).trim();

      const cleanDescription =
        String(
          description ||
            ""
        ).trim();

      const typeKey =
        String(
          type ||
            ""
        )
          .trim()
          .toUpperCase();

      const priorityKey =
        String(
          priority ||
            "MEDIUM"
        )
          .trim()
          .toUpperCase();

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Ticket title is required",
          });
      }

      if (
        !cleanDescription
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Description is required",
          });
      }

      if (
        !VALID_NEW_TYPES.includes(
          typeKey
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid ticket type",
          });
      }

      if (
        !VALID_PRIORITIES.includes(
          priorityKey
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Invalid priority",
          });
      }

      if (
        typeKey ===
        "CUSTOMIZATION"
      ) {
        const plan =
          await getCurrentPlan(
            companyId
          );

        if (
          plan !==
          "advanced"
        ) {
          return res
            .status(403)
            .json({
              success:
                false,

              message:
                "Customization Requests are available only on the Advanced plan",
            });
        }
      }

      let ticketNumber =
        await generateTicketNumber();

      let existing =
        await prisma
          .supportTicket
          .findUnique({
            where: {
              ticketNumber,
            },
          });

      while (
        existing
      ) {
        ticketNumber =
          `T-${new Date().getFullYear()}-${Date.now()}`;

        existing =
          null;
      }

      const ticket =
        await prisma
          .supportTicket
          .create({
            data: {
              companyId,

              ticketNumber,

              title:
                cleanTitle,

              description:
                cleanDescription,

              type:
                typeKey,

              priority:
                priorityKey,

              status:
                "NEW",

              submittedByName:
                user?.name ||
                null,

              submittedByEmail:
                user?.email ||
                null,
            },
          });

      await createSupportTicketCreatedNotification({
        companyId,
        userId,
        ticketNumber:
          ticket.ticketNumber,
        title:
          ticket.title,
      });

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            "Support ticket created successfully",

          ticket:
            formatTicket(
              ticket
            ),
        });
    } catch (error) {
      console.error(
        "Failed to create support ticket:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to create support ticket",
        });
    }
  }
);

export default router;
