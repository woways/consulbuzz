import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireSuperAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.use(requireSuperAdmin);

router.get("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const company =
      await prisma.company.findUnique({
        where: {
          id: companyId,
        },

        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    const [
      users,
      activeUsers,
      leads,
      admissions,
      utmLinks,
      leadDatasets,
      supportTickets,
      openSupportTickets,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          companyId,
        },
      }),

      prisma.user.count({
        where: {
          companyId,
          active: true,
        },
      }),

      prisma.lead.count({
        where: {
          companyId,
        },
      }),

      prisma.admission.count({
        where: {
          companyId,
        },
      }),

      prisma.utmLink.count({
        where: {
          companyId,
        },
      }),

      prisma.leadDataset.count({
        where: {
          companyId,
        },
      }),

      prisma.supportTicket.count({
        where: {
          companyId,
        },
      }),

      prisma.supportTicket.count({
        where: {
          companyId,

          status: {
            notIn: [
              "COMPLETED",
              "REJECTED",
              "CLOSED",
            ],
          },
        },
      }),
    ]);

    return res.json({
      success: true,

      company,

      usage: {
        users,
        activeUsers,
        leads,
        admissions,
        utmLinks,
        leadDatasets,
        supportTickets,
        openSupportTickets,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch client usage:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch client usage",
    });
  }
});

export default router;