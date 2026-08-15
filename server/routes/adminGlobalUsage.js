import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireSuperAdmin } from "../middleware/adminAuth.js";

const router = Router();

router.use(requireSuperAdmin);

function getCurrentSubscription(
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

router.get("/", async (req, res) => {
  try {
    const [
      companies,
      activeUsersByCompany,
      openTicketsByCompany,
    ] =
      await Promise.all([
        prisma.company.findMany({
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

            _count: {
              select: {
                users: true,
                leads: true,
                admissions: true,
                utmLinks: true,
                leadDatasets: true,
                supportTickets: true,
              },
            },
          },

          orderBy: {
            name: "asc",
          },
        }),

        prisma.user.groupBy({
          by: [
            "companyId",
          ],
          where: {
            companyId: {
              not: null,
            },
            active: true,
          },
          _count: {
            _all: true,
          },
        }),

        prisma.supportTicket.groupBy({
          by: [
            "companyId",
          ],
          where: {
            status: {
              notIn: [
                "COMPLETED",
                "REJECTED",
                "CLOSED",
              ],
            },
          },
          _count: {
            _all: true,
          },
        }),
      ]);

    const activeUserMap =
      new Map(
        activeUsersByCompany.map(
          (item) => [
            item.companyId,
            item._count._all,
          ]
        )
      );

    const openTicketMap =
      new Map(
        openTicketsByCompany.map(
          (item) => [
            item.companyId,
            item._count._all,
          ]
        )
      );

    const clients =
      companies.map(
        (company) => {
          const subscription =
            getCurrentSubscription(
              company.subscriptions
            );

          const users =
            company._count
              .users || 0;

          const activeUsers =
            activeUserMap.get(
              company.id
            ) || 0;

          return {
            id:
              company.id,
            name:
              company.name,
            slug:
              company.slug,
            brandName:
              company.brandName,
            status:
              company.status,
            createdAt:
              company.createdAt,
            plan:
              subscription?.plan
                ?.key || null,
            planName:
              subscription?.plan
                ?.name || null,
            subscriptionStatus:
              subscription
                ?.status || null,
            billingCycle:
              subscription
                ?.billingCycle ||
              null,
            users,
            activeUsers,
            inactiveUsers:
              Math.max(
                users -
                  activeUsers,
                0
              ),
            leads:
              company._count
                .leads || 0,
            admissions:
              company._count
                .admissions || 0,
            utmLinks:
              company._count
                .utmLinks || 0,
            leadDatasets:
              company._count
                .leadDatasets ||
              0,
            supportTickets:
              company._count
                .supportTickets ||
              0,
            openSupportTickets:
              openTicketMap.get(
                company.id
              ) || 0,
          };
        }
      );

    const totals =
      clients.reduce(
        (summary, client) => {
          summary.companies +=
            1;

          if (
            client.status ===
            "ACTIVE"
          ) {
            summary.activeCompanies +=
              1;
          }

          summary.users +=
            client.users;
          summary.activeUsers +=
            client.activeUsers;
          summary.leads +=
            client.leads;
          summary.admissions +=
            client.admissions;
          summary.utmLinks +=
            client.utmLinks;
          summary.leadDatasets +=
            client.leadDatasets;
          summary.supportTickets +=
            client.supportTickets;
          summary.openSupportTickets +=
            client.openSupportTickets;

          return summary;
        },
        {
          companies: 0,
          activeCompanies: 0,
          users: 0,
          activeUsers: 0,
          leads: 0,
          admissions: 0,
          utmLinks: 0,
          leadDatasets: 0,
          supportTickets: 0,
          openSupportTickets: 0,
        }
      );

    return res.json({
      success: true,
      totals,
      clients,
    });
  } catch (error) {
    console.error(
      "Failed to fetch global usage:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch global usage",
    });
  }
});

export default router;