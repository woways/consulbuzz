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

function monthlyEquivalent(
  subscription
) {
  if (
    !subscription ||
    subscription.status !==
      "ACTIVE"
  ) {
    return 0;
  }

  const amount =
    Number(
      subscription.amount || 0
    );

  return subscription.billingCycle ===
    "YEARLY"
    ? amount / 12
    : amount;
}

router.get("/", async (req, res) => {
  try {
    const [
      companies,
      capturedAggregate,
      failedPayments,
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
          },
          orderBy: {
            name: "asc",
          },
        }),

        prisma.paymentTransaction.aggregate({
          where: {
            status:
              "CAPTURED",
          },
          _sum: {
            amount: true,
          },
          _count: {
            _all: true,
          },
        }),

        prisma.paymentTransaction.count({
          where: {
            status:
              "FAILED",
          },
        }),
      ]);

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
            brandName:
              company.brandName,
            status:
              company.status,
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
            amount:
              Number(
                subscription
                  ?.amount || 0
              ),
            monthlyEquivalent:
              monthlyEquivalent(
                subscription
              ),
            startDate:
              subscription
                ?.startDate ||
              null,
            renewalDate:
              subscription
                ?.renewalDate ||
              null,
            endDate:
              subscription
                ?.endDate ||
              null,
            monthlyPrice:
              subscription?.plan
                ?.monthlyPrice
                ? Number(
                    subscription.plan
                      .monthlyPrice
                  )
                : 0,
            yearlyPrice:
              subscription?.plan
                ?.yearlyPrice
                ? Number(
                    subscription.plan
                      .yearlyPrice
                  )
                : 0,
          };
        }
      );

    const totals =
      clients.reduce(
        (summary, client) => {
          summary.clients +=
            1;

          const status =
            client.subscriptionStatus;

          if (
            status ===
            "ACTIVE"
          ) {
            summary.activeSubscriptions +=
              1;
          } else if (
            status ===
            "TRIAL"
          ) {
            summary.trialSubscriptions +=
              1;
          } else if (
            status ===
            "PAST_DUE"
          ) {
            summary.pastDueSubscriptions +=
              1;
          } else if (
            status ===
            "CANCELLED"
          ) {
            summary.cancelledSubscriptions +=
              1;
          } else if (
            status ===
            "EXPIRED"
          ) {
            summary.expiredSubscriptions +=
              1;
          }

          summary.monthlyRecurringValue +=
            Number(
              client.monthlyEquivalent ||
                0
            );

          summary.totalSubscriptionValue +=
            Number(
              client.amount ||
                0
            );

          return summary;
        },
        {
          clients: 0,
          activeSubscriptions:
            0,
          trialSubscriptions:
            0,
          pastDueSubscriptions:
            0,
          cancelledSubscriptions:
            0,
          expiredSubscriptions:
            0,
          monthlyRecurringValue:
            0,
          totalSubscriptionValue:
            0,
        }
      );

    totals.monthlyRecurringValue =
      Number(
        totals.monthlyRecurringValue.toFixed(
          2
        )
      );

    totals.capturedPayments =
      capturedAggregate
        ._count._all;

    totals.capturedPaymentValue =
      Number(
        capturedAggregate
          ._sum.amount || 0
      );

    totals.failedPayments =
      failedPayments;

    return res.json({
      success: true,
      totals,
      clients,
    });
  } catch (error) {
    console.error(
      "Failed to fetch global billing:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch global billing",
    });
  }
});

export default router;