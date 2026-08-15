import crypto from "crypto";
import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  getRazorpayClient,
  getRazorpayConfig,
} from "../lib/razorpay.js";
import {
  finalizeCapturedPayment,
} from "../lib/subscriptions.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

function ensureClientAdmin(req, res) {
  if (
    req.clientUser.role !==
    "CLIENT_ADMIN"
  ) {
    res.status(403).json({
      success: false,
      message:
        "Only the Client Admin can manage subscription payments",
    });

    return false;
  }

  return true;
}

function safeEqualHex(a, b) {
  try {
    const aBuffer =
      Buffer.from(a, "hex");
    const bBuffer =
      Buffer.from(b, "hex");

    return (
      aBuffer.length ===
        bBuffer.length &&
      crypto.timingSafeEqual(
        aBuffer,
        bBuffer
      )
    );
  } catch {
    return false;
  }
}

function paymentAmount(plan, billingCycle) {
  if (billingCycle === "YEARLY") {
    return plan.yearlyPrice !== null &&
      plan.yearlyPrice !== undefined
      ? Number(plan.yearlyPrice)
      : null;
  }

  return Number(
    plan.monthlyPrice
  );
}

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const [
      subscription,
      plans,
      payments,
    ] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          companyId,
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.plan.findMany({
        where: {
          active: true,
        },
        orderBy: {
          monthlyPrice: "asc",
        },
      }),

      prisma.paymentTransaction.findMany({
        where: {
          companyId,
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      }),
    ]);

    return res.json({
      success: true,

      subscription:
        subscription
          ? {
              id: subscription.id,
              status:
                subscription.status,
              billingCycle:
                subscription.billingCycle,
              amount: Number(
                subscription.amount || 0
              ),
              startDate:
                subscription.startDate,
              renewalDate:
                subscription.renewalDate,
              endDate:
                subscription.endDate,
              plan: {
                id:
                  subscription.plan.id,
                key:
                  subscription.plan.key,
                name:
                  subscription.plan.name,
              },
            }
          : null,

      plans: plans.map(
        (plan) => ({
          id: plan.id,
          key: plan.key,
          name: plan.name,
          tagline:
            plan.tagline || "",
          description:
            plan.description || "",
          monthlyPrice: Number(
            plan.monthlyPrice
          ),
          yearlyPrice:
            plan.yearlyPrice !== null
              ? Number(
                  plan.yearlyPrice
                )
              : null,
        })
      ),

      payments: payments.map(
        (payment) => ({
          id: payment.id,
          status: payment.status,
          billingCycle:
            payment.billingCycle,
          amount: Number(
            payment.amount
          ),
          currency:
            payment.currency,
          providerOrderId:
            payment.providerOrderId,
          providerPaymentId:
            payment.providerPaymentId,
          paidAt:
            payment.paidAt,
          createdAt:
            payment.createdAt,
          plan: {
            key:
              payment.plan.key,
            name:
              payment.plan.name,
          },
        })
      ),
    });
  } catch (error) {
    console.error(
      "Load client billing failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load subscription billing",
    });
  }
});

router.post(
  "/create-order",
  async (req, res) => {
    try {
      if (!ensureClientAdmin(req, res)) {
        return;
      }

      const planKey = String(
        req.body?.planKey || ""
      )
        .trim()
        .toLowerCase();

      const billingCycle = String(
        req.body?.billingCycle ||
          "MONTHLY"
      )
        .trim()
        .toUpperCase();

      if (
        ![
          "MONTHLY",
          "YEARLY",
        ].includes(
          billingCycle
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid billing cycle",
        });
      }

      const plan =
        await prisma.plan.findUnique({
          where: {
            key: planKey,
          },
        });

      if (!plan || !plan.active) {
        return res.status(404).json({
          success: false,
          message:
            "Selected plan is unavailable",
        });
      }

      const amount =
        paymentAmount(
          plan,
          billingCycle
        );

      if (
        amount === null ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${billingCycle === "YEARLY" ? "Yearly" : "Monthly"} pricing is unavailable for this plan`,
        });
      }

      const amountPaise =
        Math.round(
          amount * 100
        );

      const receipt =
        `cb_${Date.now()}_${req.clientUser.companyId.slice(-6)}`.slice(
          0,
          40
        );

      const razorpay =
        getRazorpayClient();

      const order =
        await razorpay.orders.create({
          amount:
            amountPaise,
          currency: "INR",
          receipt,
          notes: {
            companyId:
              req.clientUser.companyId,
            userId:
              req.clientUser.userId,
            planKey:
              plan.key,
            billingCycle,
          },
        });

      const transaction =
        await prisma.paymentTransaction.create({
          data: {
            companyId:
              req.clientUser.companyId,
            planId: plan.id,
            initiatedByUserId:
              req.clientUser.userId,
            provider: "RAZORPAY",
            status: "CREATED",
            billingCycle,
            amount,
            currency: "INR",
            providerOrderId:
              order.id,
            receipt,
          },
        });

      const { keyId } =
        getRazorpayConfig();

      return res.status(201).json({
        success: true,
        transactionId:
          transaction.id,
        keyId,
        order: {
          id: order.id,
          amount:
            order.amount,
          currency:
            order.currency,
        },
        plan: {
          key: plan.key,
          name: plan.name,
        },
        billingCycle,
      });
    } catch (error) {
      console.error(
        "Create Razorpay order failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to start payment",
      });
    }
  }
);

router.post(
  "/verify-payment",
  async (req, res) => {
    try {
      if (!ensureClientAdmin(req, res)) {
        return;
      }

      const orderId =
        String(
          req.body?.razorpay_order_id ||
            ""
        ).trim();

      const paymentId =
        String(
          req.body?.razorpay_payment_id ||
            ""
        ).trim();

      const signature =
        String(
          req.body?.razorpay_signature ||
            ""
        ).trim();

      if (
        !orderId ||
        !paymentId ||
        !signature
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Incomplete payment verification details",
        });
      }

      const transaction =
        await prisma.paymentTransaction.findFirst({
          where: {
            companyId:
              req.clientUser.companyId,
            providerOrderId:
              orderId,
          },
        });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message:
            "Payment transaction not found",
        });
      }

      const { keySecret } =
        getRazorpayConfig();

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            keySecret
          )
          .update(
            `${orderId}|${paymentId}`
          )
          .digest("hex");

      if (
        !safeEqualHex(
          expectedSignature,
          signature
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment signature verification failed",
        });
      }

      const razorpay =
        getRazorpayClient();

      const providerPayment =
        await razorpay.payments.fetch(
          paymentId
        );

      if (
        providerPayment.order_id !==
          orderId ||
        Number(
          providerPayment.amount
        ) !==
          Math.round(
            Number(
              transaction.amount
            ) * 100
          ) ||
        providerPayment.currency !==
          transaction.currency
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment details do not match the order",
        });
      }

      if (
        providerPayment.status ===
        "captured"
      ) {
        await finalizeCapturedPayment({
          transactionId:
            transaction.id,
          providerPaymentId:
            paymentId,
        });

        return res.json({
          success: true,
          captured: true,
          message:
            "Payment verified and subscription activated successfully",
        });
      }

      await prisma.paymentTransaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status:
            providerPayment.status ===
            "authorized"
              ? "AUTHORIZED"
              : transaction.status,
          providerPaymentId:
            paymentId,
        },
      });

      return res.status(202).json({
        success: true,
        captured: false,
        message:
          "Payment verified and is awaiting capture. The subscription will activate automatically after Razorpay confirms capture.",
      });
    } catch (error) {
      console.error(
        "Verify Razorpay payment failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify payment",
      });
    }
  }
);

export default router;