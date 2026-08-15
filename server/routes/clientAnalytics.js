import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

const SOURCE_LABELS = {
  GOOGLE_FORM: "Google Form",
  WEBSITE_FORM: "Website Form",
  IM_LEADS: "IM Leads",
  DM_LEADS: "DM Leads",
  OTHER: "Other",
};

const STAGE_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  COUNSELLING: "Counselling",
  ADMITTED: "Admitted",
  LOST: "Lost",
};

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

function getLastMonths(count = 8) {
  const now = new Date();
  const months = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(
      new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      )
    );
  }

  return months;
}

/* =========================================================
   DASHBOARD
========================================================= */

router.get("/dashboard", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const [
      leads,
      admissions,
      expenses,
      incentives,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: {
          companyId,
        },

        select: {
          id: true,
          source: true,
          stage: true,
          assignedToName: true,
          createdAt: true,
        },
      }),

      prisma.admission.findMany({
        where: {
          companyId,
          status: {
            not: "CANCELLED",
          },
        },

        select: {
          id: true,
          counsellorName: true,
          totalFee: true,
          paidAmount: true,
          admissionDate: true,
        },
      }),

      prisma.expense.findMany({
        where: {
          companyId,
          status: "APPROVED",
        },

        select: {
          amount: true,
        },
      }),

      prisma.incentive.findMany({
        where: {
          companyId,
          status: {
            in: [
              "APPROVED",
              "PAID",
            ],
          },
        },

        select: {
          amount: true,
        },
      }),
    ]);

    const totalLeads = leads.length;

    const newLeads = leads.filter(
      (lead) => lead.stage === "NEW"
    ).length;

    const qualifiedLeads = leads.filter(
      (lead) =>
        lead.stage === "QUALIFIED"
    ).length;

    const totalAdmissions =
      admissions.length;

    const potentialRevenue =
      admissions.reduce(
        (sum, admission) =>
          sum +
          Number(admission.totalFee || 0),
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

    const pendingAmount = Math.max(
      potentialRevenue -
        receivedAmount,
      0
    );

    const approvedExpenses =
      expenses.reduce(
        (sum, expense) =>
          sum +
          Number(expense.amount || 0),
        0
      );

    const totalIncentives =
      incentives.reduce(
        (sum, incentive) =>
          sum +
          Number(incentive.amount || 0),
        0
      );

    const currentProfit =
      receivedAmount -
      approvedExpenses -
      totalIncentives;

    const months =
      getLastMonths(8);

    const revenueTrend =
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

        return {
          key,
          m: monthLabel(month),

          potential:
            monthAdmissions.reduce(
              (sum, admission) =>
                sum +
                Number(
                  admission.totalFee ||
                    0
                ),
              0
            ),

          received:
            monthAdmissions.reduce(
              (sum, admission) =>
                sum +
                Number(
                  admission.paidAmount ||
                    0
                ),
              0
            ),
        };
      });

    const sourceCounts = {};

    for (const lead of leads) {
      const source =
        SOURCE_LABELS[
          lead.source
        ] || lead.source;

      sourceCounts[source] =
        (sourceCounts[source] || 0) +
        1;
    }

    const leadsBySource =
      Object.entries(
        sourceCounts
      ).map(([name, value]) => ({
        name,
        value,
      }));

    const teamMap = {};

    for (const lead of leads) {
      const name =
        lead.assignedToName ||
        "Unassigned";

      if (!teamMap[name]) {
        teamMap[name] = {
          name,
          leads: 0,
          admissions: 0,
          revenue: 0,
        };
      }

      teamMap[name].leads += 1;
    }

    for (const admission of admissions) {
      const name =
        admission.counsellorName ||
        "Unassigned";

      if (!teamMap[name]) {
        teamMap[name] = {
          name,
          leads: 0,
          admissions: 0,
          revenue: 0,
        };
      }

      teamMap[name].admissions += 1;

      teamMap[name].revenue +=
        Number(
          admission.paidAmount || 0
        );
    }

    const teamPerformance =
      Object.values(teamMap).sort(
        (a, b) =>
          b.admissions -
          a.admissions
      );

    return res.json({
      success: true,

      summary: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        totalAdmissions,
        potentialRevenue,
        receivedAmount,
        pendingAmount,
        currentProfit,
      },

      revenueTrend,
      leadsBySource,
      teamPerformance,
    });
  } catch (error) {
    console.error(
      "Failed to fetch dashboard:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load dashboard",
    });
  }
});

/* =========================================================
   ANALYTICS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const [
      leads,
      admissions,
    ] = await Promise.all([
      prisma.lead.findMany({
        where: {
          companyId,
        },

        select: {
          id: true,
          source: true,
          stage: true,
          campaign: true,
          assignedToName: true,
          createdAt: true,
        },
      }),

      prisma.admission.findMany({
        where: {
          companyId,
          status: {
            not: "CANCELLED",
          },
        },

        select: {
          id: true,
          leadId: true,
          counsellorName: true,
          totalFee: true,
          paidAmount: true,
          admissionDate: true,
        },
      }),
    ]);

    const totalLeads =
      leads.length;

    const totalAdmissions =
      admissions.length;

    const conversionRate =
      totalLeads > 0
        ? Number(
            (
              (totalAdmissions /
                totalLeads) *
              100
            ).toFixed(1)
          )
        : 0;

    const sourceMap = {};

    for (const lead of leads) {
      const source =
        SOURCE_LABELS[
          lead.source
        ] || lead.source;

      if (!sourceMap[source]) {
        sourceMap[source] = {
          name: source,
          leads: 0,
          admissions: 0,
        };
      }

      sourceMap[source].leads += 1;
    }

    const admissionLeadIds =
      new Set(
        admissions
          .map(
            (admission) =>
              admission.leadId
          )
          .filter(Boolean)
      );

    for (const lead of leads) {
      if (
        admissionLeadIds.has(
          lead.id
        )
      ) {
        const source =
          SOURCE_LABELS[
            lead.source
          ] || lead.source;

        if (!sourceMap[source]) {
          sourceMap[source] = {
            name: source,
            leads: 0,
            admissions: 0,
          };
        }

        sourceMap[
          source
        ].admissions += 1;
      }
    }

    const sourceConversion =
      Object.values(
        sourceMap
      ).map((item) => ({
        ...item,

        conversion:
          item.leads > 0
            ? Number(
                (
                  (item.admissions /
                    item.leads) *
                  100
                ).toFixed(1)
              )
            : 0,
      }));

    const stageMap = {};

    for (const lead of leads) {
      const stage =
        STAGE_LABELS[
          lead.stage
        ] || lead.stage;

      stageMap[stage] =
        (stageMap[stage] || 0) +
        1;
    }

    const leadsByStage =
      Object.entries(
        stageMap
      ).map(([name, value]) => ({
        name,
        value,
      }));

    const months =
      getLastMonths(8);

    const monthlyActivity =
      months.map((month) => {
        const key =
          monthKey(month);

        return {
          key,
          m: monthLabel(month),

          leads: leads.filter(
            (lead) =>
              monthKey(
                new Date(
                  lead.createdAt
                )
              ) === key
          ).length,

          admissions:
            admissions.filter(
              (admission) =>
                monthKey(
                  new Date(
                    admission.admissionDate
                  )
                ) === key
            ).length,

          potential:
            admissions
              .filter(
                (admission) =>
                  monthKey(
                    new Date(
                      admission.admissionDate
                    )
                  ) === key
              )
              .reduce(
                (sum, admission) =>
                  sum +
                  Number(
                    admission.totalFee ||
                      0
                  ),
                0
              ),

          received:
            admissions
              .filter(
                (admission) =>
                  monthKey(
                    new Date(
                      admission.admissionDate
                    )
                  ) === key
              )
              .reduce(
                (sum, admission) =>
                  sum +
                  Number(
                    admission.paidAmount ||
                      0
                  ),
                0
              ),
        };
      });

    const employeeMap = {};

    for (const lead of leads) {
      const name =
        lead.assignedToName ||
        "Unassigned";

      if (!employeeMap[name]) {
        employeeMap[name] = {
          name,
          leads: 0,
          admissions: 0,
          revenue: 0,
        };
      }

      employeeMap[name].leads += 1;
    }

    for (const admission of admissions) {
      const name =
        admission.counsellorName ||
        "Unassigned";

      if (!employeeMap[name]) {
        employeeMap[name] = {
          name,
          leads: 0,
          admissions: 0,
          revenue: 0,
        };
      }

      employeeMap[
        name
      ].admissions += 1;

      employeeMap[
        name
      ].revenue += Number(
        admission.paidAmount || 0
      );
    }

    const employeePerformance =
      Object.values(
        employeeMap
      ).sort(
        (a, b) =>
          b.admissions -
          a.admissions
      );

    const campaignMap = {};

    for (const lead of leads) {
      const campaign =
        lead.campaign ||
        "No Campaign";

      if (!campaignMap[campaign]) {
        campaignMap[campaign] = {
          campaign,
          leads: 0,
          admissions: 0,
        };
      }

      campaignMap[
        campaign
      ].leads += 1;

      if (
        admissionLeadIds.has(
          lead.id
        )
      ) {
        campaignMap[
          campaign
        ].admissions += 1;
      }
    }

    const topCampaigns =
      Object.values(campaignMap)
        .map((item) => ({
          ...item,

          conversion:
            item.leads > 0
              ? Number(
                  (
                    (item.admissions /
                      item.leads) *
                    100
                  ).toFixed(1)
                )
              : 0,
        }))
        .sort(
          (a, b) =>
            b.admissions -
            a.admissions
        )
        .slice(0, 10);

    return res.json({
      success: true,

      summary: {
        totalLeads,
        totalAdmissions,
        conversionRate,
      },

      sourceConversion,
      leadsByStage,
      monthlyActivity,
      employeePerformance,
      topCampaigns,
    });
  } catch (error) {
    console.error(
      "Failed to fetch analytics:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load analytics",
    });
  }
});

export default router;