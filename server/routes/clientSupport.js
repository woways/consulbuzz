import {
  Router,
} from "express";
import {
  randomInt,
} from "crypto";

import prisma from "../lib/prisma.js";

import {
  requireClientUser,
  requireClientPermission,
} from "../middleware/clientAuth.js";

import {
  createSupportTicketCreatedNotification,
} from "../lib/notifications.js";

const router =
  Router();

router.use(
  requireClientUser
);

router.use(
  requireClientPermission(
    "canManageSupport",
    "You do not have permission to manage support"
  )
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

function generateTicketNumber() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  const time =
    [
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ]
      .map(
        (value) =>
          String(
            value
          ).padStart(
            2,
            "0"
          )
      )
      .join("");

  const suffix =
    String(
      randomInt(
        1000,
        10000
      )
    );

  return `T-${year}${month}${day}-${time}-${suffix}`;
}

async function createTicketWithUniqueNumber(
  data
) {
  for (
    let attempt = 0;
    attempt < 5;
    attempt += 1
  ) {
    try {
      return await prisma.supportTicket.create({
        data: {
          ...data,
          ticketNumber:
            generateTicketNumber(),
        },
      });
    } catch (error) {
      const isUniqueConflict =
        error?.code ===
        "P2002";

      if (
        !isUniqueConflict ||
        attempt === 4
      ) {
        throw error;
      }
    }
  }

  throw new Error(
    "Unable to generate a unique ticket number"
  );
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

              active:
                true,

              companyId:
                true,
            },
          });

      if (
        !user ||
        !user.active ||
        user.companyId !==
          companyId
      ) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Unauthorized",
          });
      }

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

      const ticket =
        await createTicketWithUniqueNumber({
          companyId,

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
            user.name,

          submittedByEmail:
            user.email,
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