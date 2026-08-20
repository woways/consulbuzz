import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
  requireClientPermission,
} from "../middleware/clientAuth.js";

const router = Router();

function parseYear(value) {
  if (!value || value === "all") return null;
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
}

function yearRange(year) {
  if (!year) return null;
  return {
    gte: new Date(year, 0, 1),
    lt: new Date(year + 1, 0, 1),
  };
}


router.use(requireClientUser);

router.use(
  requireClientPermission(
    "canManageRevenue",
    "You do not have permission to access revenue"
  )
);

function monthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function monthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
  });
}

function expenseResponse(expense) {
  return {
    id: expense.id,
    title: expense.title,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount),
    expenseDate: expense.expenseDate,
    submittedByName: expense.submittedByName,
    approvedByName: expense.approvedByName,
    paymentMode: expense.paymentMode,
    transactionRef: expense.transactionRef,
    vendorName: expense.vendorName,
    invoiceNumber: expense.invoiceNumber,
    receiptUrl: expense.receiptUrl,
    status: expense.status,
    createdAt: expense.createdAt,
  };
}


async function getActor(req) {
  return prisma.user.findFirst({
    where: {
      id: req.clientUser.userId,
      companyId: req.clientUser.companyId,
      active: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

function parseOptionalDate(value) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function incentiveResponse(incentive) {
  return {
    id: incentive.id,
    userId: incentive.userId,
    admissionId: incentive.admissionId,
    employeeName: incentive.employeeName,
    title: incentive.title,
    description: incentive.description,
    amount: Number(incentive.amount),
    incentiveDate: incentive.incentiveDate,
    status: incentive.status,
    approvedByName: incentive.approvedByName,
    paidDate: incentive.paidDate,
    createdAt: incentive.createdAt,

    admission: incentive.admission
      ? {
          id: incentive.admission.id,
          studentName:
            incentive.admission.studentName,
          college:
            incentive.admission.college,
        }
      : null,
  };
}

/* =========================================================
   GET REVENUE
========================================================= */

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;
    const selectedYear = parseYear(req.query.year);

    const [
      admissions,
      expenses,
      incentives,
    ] = await Promise.all([
      prisma.admission.findMany({
        where: {
          companyId,
          ...(selectedYear ? { admissionDate: yearRange(selectedYear) } : {}),

          status: {
            not: "CANCELLED",
          },
        },

        select: {
          totalFee: true,
          paidAmount: true,
          admissionDate: true,
        },

        orderBy: {
          admissionDate: "asc",
        },
      }),

      prisma.expense.findMany({
        where: {
          companyId,
          ...(selectedYear ? { expenseDate: yearRange(selectedYear) } : {}),
        },

        orderBy: {
          expenseDate: "desc",
        },
      }),

      prisma.incentive.findMany({
        where: {
          companyId,
          ...(selectedYear ? { incentiveDate: yearRange(selectedYear) } : {}),
        },

        include: {
          admission: {
            select: {
              id: true,
              studentName: true,
              college: true,
            },
          },
        },

        orderBy: {
          incentiveDate: "desc",
        },
      }),
    ]);

    const potentialRevenue =
      admissions.reduce(
        (sum, admission) =>
          sum +
          Number(
            admission.totalFee || 0
          ),
        0
      );

    const receivedAmount =
      admissions.reduce(
        (sum, admission) =>
          sum +
          Number(
            admission.paidAmount || 0
          ),
        0
      );

    const pendingAmount =
      Math.max(
        potentialRevenue -
          receivedAmount,
        0
      );

    const approvedExpenses =
      expenses
        .filter(
          (expense) =>
            expense.status ===
            "APPROVED"
        )
        .reduce(
          (sum, expense) =>
            sum +
            Number(
              expense.amount || 0
            ),
          0
        );

    const totalIncentives =
      incentives
        .filter(
          (incentive) =>
            incentive.status ===
              "APPROVED" ||
            incentive.status ===
              "PAID"
        )
        .reduce(
          (sum, incentive) =>
            sum +
            Number(
              incentive.amount || 0
            ),
          0
        );

    const currentProfit =
      receivedAmount -
      approvedExpenses -
      totalIncentives;

    const now = new Date();

    const months = selectedYear
      ? Array.from({ length: 12 }, (_, month) => new Date(selectedYear, month, 1))
      : [];

    if (!selectedYear) {
      for (let offset = 7; offset >= 0; offset -= 1) {
        months.push(new Date(now.getFullYear(), now.getMonth() - offset, 1));
      }
    }

    const monthlyRevenue =
      months.map((month) => {
        const key =
          monthKey(month);

        const monthAdmissions =
          admissions.filter(
            (admission) =>
              monthKey(
                new Date(
                  admission.admissionDate
                )
              ) === key
          );

        const potential =
          monthAdmissions.reduce(
            (sum, admission) =>
              sum +
              Number(
                admission.totalFee ||
                  0
              ),
            0
          );

        const received =
          monthAdmissions.reduce(
            (sum, admission) =>
              sum +
              Number(
                admission.paidAmount ||
                  0
              ),
            0
          );

        return {
          key,
          m: monthLabel(month),
          potential,
          received,
        };
      });

    return res.json({
      success: true,

      summary: {
        potentialRevenue,
        receivedAmount,
        pendingAmount,
        approvedExpenses,
        totalIncentives,
        currentProfit,
        totalAdmissions:
          admissions.length,
      },

      monthlyRevenue,

      expenses:
        expenses.map(
          expenseResponse
        ),

      incentives:
        incentives.map(
          incentiveResponse
        ),
    });
  } catch (error) {
    console.error(
      "Failed to fetch revenue:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch revenue",
    });
  }
});

/* =========================================================
   CREATE EXPENSE
========================================================= */

router.post(
  "/expenses",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const {
        title,
        category,
        description,
        amount,
        expenseDate,
        paymentMode,
        transactionRef,
        vendorName,
        invoiceNumber,
      } = req.body || {};

      const cleanTitle =
        String(
          title || ""
        ).trim();

      const cleanCategory =
        String(
          category || ""
        ).trim();

      const parsedAmount =
        Number(amount || 0);

      if (!cleanTitle) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Expense title is required",
          });
      }

      if (!cleanCategory) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Expense category is required",
          });
      }

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Expense amount must be greater than zero",
          });
      }

      const actor =
        await getActor(req);

      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const parsedExpenseDate =
        parseOptionalDate(expenseDate);

      if (!parsedExpenseDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid expense date",
        });
      }

      const expense =
        await prisma.expense.create({
          data: {
            companyId,

            title: cleanTitle,

            category:
              cleanCategory,

            description:
              description
                ? String(
                    description
                  ).trim()
                : null,

            amount:
              parsedAmount,

            expenseDate:
              parsedExpenseDate,

            submittedByName:
              actor.name,

            paymentMode:
              paymentMode
                ? String(
                    paymentMode
                  ).trim()
                : null,

            transactionRef:
              transactionRef
                ? String(
                    transactionRef
                  ).trim()
                : null,

            vendorName:
              vendorName
                ? String(
                    vendorName
                  ).trim()
                : null,

            invoiceNumber:
              invoiceNumber
                ? String(
                    invoiceNumber
                  ).trim()
                : null,

            status: "PENDING",
          },
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Expense created successfully",
          expense:
            expenseResponse(
              expense
            ),
        });
    } catch (error) {
      console.error(
        "Failed to create expense:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create expense",
        });
    }
  }
);

/* =========================================================
   UPDATE EXPENSE STATUS
========================================================= */

router.patch(
  "/expenses/:id/status",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      if (
        req.clientUser.role !==
        "CLIENT_ADMIN"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only Client Admin can approve or reject expenses",
          });
      }

      const status =
        String(
          req.body?.status || ""
        ).toUpperCase();

      if (
        ![
          "APPROVED",
          "REJECTED",
        ].includes(status)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid expense status",
          });
      }

      const expense =
        await prisma.expense.findFirst({
          where: {
            id: req.params.id,
            companyId,
          },
        });

      if (!expense) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Expense not found",
          });
      }

      const actor =
        await getActor(req);

      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const updated =
        await prisma.expense.update({
          where: {
            id: expense.id,
          },

          data: {
            status,

            approvedByName:
              actor.name,
          },
        });

      return res.json({
        success: true,
        message:
          "Expense status updated",
        expense:
          expenseResponse(
            updated
          ),
      });
    } catch (error) {
      console.error(
        "Failed to update expense:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update expense",
        });
    }
  }
);

/* =========================================================
   CREATE INCENTIVE
========================================================= */

router.post(
  "/incentives",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const {
        employeeName,
        admissionId,
        title,
        description,
        amount,
        incentiveDate,
      } = req.body || {};

      const cleanEmployeeName =
        String(
          employeeName || ""
        ).trim();

      const parsedAmount =
        Number(amount || 0);

      if (!cleanEmployeeName) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Employee name is required",
          });
      }

      if (
        !Number.isFinite(
          parsedAmount
        ) ||
        parsedAmount <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Incentive amount must be greater than zero",
          });
      }

      let validAdmissionId =
        null;

      if (admissionId) {
        const admission =
          await prisma.admission.findFirst({
            where: {
              id: String(
                admissionId
              ),
              companyId,
            },
          });

        if (!admission) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid admission for this company",
            });
        }

        validAdmissionId =
          admission.id;
      }

      const parsedIncentiveDate =
        parseOptionalDate(incentiveDate);

      if (!parsedIncentiveDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid incentive date",
        });
      }

      const incentive =
        await prisma.incentive.create({
          data: {
            companyId,

            admissionId:
              validAdmissionId,

            employeeName:
              cleanEmployeeName,

            title: title
              ? String(
                  title
                ).trim()
              : null,

            description:
              description
                ? String(
                    description
                  ).trim()
                : null,

            amount:
              parsedAmount,

            incentiveDate:
              parsedIncentiveDate,

            status: "PENDING",
          },

          include: {
            admission: {
              select: {
                id: true,
                studentName: true,
                college: true,
              },
            },
          },
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Incentive created successfully",
          incentive:
            incentiveResponse(
              incentive
            ),
        });
    } catch (error) {
      console.error(
        "Failed to create incentive:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create incentive",
        });
    }
  }
);

/* =========================================================
   UPDATE INCENTIVE STATUS
========================================================= */

router.patch(
  "/incentives/:id/status",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      if (
        req.clientUser.role !==
        "CLIENT_ADMIN"
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "Only Client Admin can update incentive status",
          });
      }

      const status =
        String(
          req.body?.status || ""
        ).toUpperCase();

      if (
        ![
          "APPROVED",
          "PAID",
          "REJECTED",
        ].includes(status)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid incentive status",
          });
      }

      const incentive =
        await prisma.incentive.findFirst({
          where: {
            id: req.params.id,
            companyId,
          },
        });

      if (!incentive) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Incentive not found",
          });
      }

      const actor =
        await getActor(req);

      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const updated =
        await prisma.incentive.update({
          where: {
            id: incentive.id,
          },

          data: {
            status,

            approvedByName:
              actor.name,

            paidDate:
              status === "PAID"
                ? incentive.paidDate ||
                  new Date()
                : null,
          },

          include: {
            admission: {
              select: {
                id: true,
                studentName: true,
                college: true,
              },
            },
          },
        });

      return res.json({
        success: true,
        message:
          "Incentive status updated",
        incentive:
          incentiveResponse(
            updated
          ),
      });
    } catch (error) {
      console.error(
        "Failed to update incentive:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update incentive",
        });
    }
  }
);

export default router;