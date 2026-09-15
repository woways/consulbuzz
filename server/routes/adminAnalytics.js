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

function getAnnualValue(
  subscription
) {
  if (
    !subscription ||
    subscription.status !==
      "ACTIVE"
  ) {
    return 0;
  }

  const amount = Number(
    subscription.amount || 0
  );

  return subscription.billingCycle ===
    "YEARLY"
    ? amount
    : amount * 12;
}

function monthKey(date) {
  const parsed =
    new Date(date);

  return `${parsed.getFullYear()}-${String(
    parsed.getMonth() + 1
  ).padStart(2, "0")}`;
}

function monthLabel(date) {
  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "2-digit",
    }
  );
}

router.get("/", async (req, res) => {
  try {
    const companies =
      await prisma.company.findMany({
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
            },
          },
        },

        orderBy: {
          createdAt:
            "asc",
        },
      });

    const clients =
      companies.map(
        (company) => {
          const subscription =
            getCurrentSubscription(
              company.subscriptions
            );

          return {
            id:
              company.id,
            name:
              company.name,
            status:
              company.status,
            createdAt:
              company.createdAt,
            users:
              company._count
                .users || 0,
            plan:
              subscription?.plan
                ?.key || null,
            planName:
              subscription?.plan
                ?.name ||
              "No Plan",
            subscriptionStatus:
              subscription
                ?.status || null,
            annualValue:
              getAnnualValue(
                subscription
              ),
          };
        }
      );

    const planMap =
      new Map();

    for (
      const client of
        clients
    ) {
      const key =
        client.plan ||
        "no-plan";

      if (
        !planMap.has(key)
      ) {
        planMap.set(key, {
          key,
          name:
            client.planName ||
            "No Plan",
          clients: 0,
          annualValue: 0,
        });
      }

      const current =
        planMap.get(key);

      current.clients +=
        1;

      current.annualValue +=
        Number(
          client.annualValue ||
            0
        );
    }

    const statusMap =
      new Map();

    const companyStatusMap =
      new Map();

    for (
      const client of
        clients
    ) {
      const subscriptionStatus =
        client.subscriptionStatus ||
        "NO_SUBSCRIPTION";

      statusMap.set(
        subscriptionStatus,
        (statusMap.get(
          subscriptionStatus
        ) || 0) + 1
      );

      companyStatusMap.set(
        client.status,
        (companyStatusMap.get(
          client.status
        ) || 0) + 1
      );
    }

    const now =
      new Date();

    const growthMonths =
      [];

    for (
      let offset = 11;
      offset >= 0;
      offset -= 1
    ) {
      const date =
        new Date(
          now.getFullYear(),
          now.getMonth() -
            offset,
          1
        );

      growthMonths.push({
        key:
          monthKey(date),
        label:
          monthLabel(date),
        newClients: 0,
        cumulativeClients:
          0,
      });
    }

    const growthMap =
      new Map(
        growthMonths.map(
          (item) => [
            item.key,
            item,
          ]
        )
      );

    for (
      const company of
        companies
    ) {
      const key =
        monthKey(
          company.createdAt
        );

      if (
        growthMap.has(key)
      ) {
        growthMap.get(
          key
        ).newClients +=
          1;
      }
    }

    const firstMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          11,
        1
      );

    let cumulative =
      companies.filter(
        (company) =>
          new Date(
            company.createdAt
          ) < firstMonth
      ).length;

    for (
      const month of
        growthMonths
    ) {
      cumulative +=
        month.newClients;

      month.cumulativeClients =
        cumulative;
    }

    const totalClients =
      clients.length;

    const activeClients =
      clients.filter(
        (client) =>
          client.status ===
          "ACTIVE"
      ).length;

    const totalUsers =
      clients.reduce(
        (sum, client) =>
          sum +
          Number(
            client.users || 0
          ),
        0
      );

    const annualRecurringValue =
      clients.reduce(
        (sum, client) =>
          sum +
          Number(
            client.annualValue ||
              0
          ),
        0
      );

    return res.json({
      success: true,

      summary: {
        totalClients,
        activeClients,
        totalUsers,
        annualRecurringValue:
          Number(
            annualRecurringValue.toFixed(
              2
            )
          ),
        activeSubscriptions:
          clients.filter(
            (client) =>
              client.subscriptionStatus ===
              "ACTIVE"
          ).length,
        trialSubscriptions:
          clients.filter(
            (client) =>
              client.subscriptionStatus ===
              "TRIAL"
          ).length,
      },

      planDistribution:
        Array.from(
          planMap.values()
        ),

      subscriptionStatus:
        Array.from(
          statusMap.entries()
        ).map(
          ([
            status,
            count,
          ]) => ({
            status,
            count,
          })
        ),

      companyStatus:
        Array.from(
          companyStatusMap.entries()
        ).map(
          ([
            status,
            count,
          ]) => ({
            status,
            count,
          })
        ),

      clientGrowth:
        growthMonths,

      usersByClient:
        clients
          .slice()
          .sort(
            (a, b) =>
              b.users -
              a.users
          )
          .map(
            (client) => ({
              name:
                client.name,
              users:
                client.users,
              plan:
                client.planName,
            })
          ),

      arrByClient:
        clients
          .slice()
          .sort(
            (a, b) =>
              b.annualValue -
              a.annualValue
          )
          .map(
            (client) => ({
              name:
                client.name,
              annualValue:
                Number(
                  client.annualValue.toFixed(
                    2
                  )
                ),
              plan:
                client.planName,
            })
          ),
    });
  } catch (error) {
    console.error(
      "Failed to fetch admin analytics:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch analytics",
    });
  }
});

export default router;