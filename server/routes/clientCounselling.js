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

function parseMarket(value, fallback = null) {
  const market = String(value || "").trim().toUpperCase();
  if (market === "DOMESTIC" || market === "INTERNATIONAL") return market;
  return fallback;
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
    "canManageAdmissions",
    "You do not have permission to manage counselling"
  )
);

const VALID_STATUSES = [
  "SCHEDULED",
  "FOLLOW_UP",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
];

const STATUS_LABELS = {
  SCHEDULED: "Scheduled",
  FOLLOW_UP: "Follow Up",
  COMPLETED: "Completed",
  NO_SHOW: "No Show",
  CANCELLED: "Cancelled",
};

function cleanOptional(value) {
  const clean = String(value || "").trim();
  return clean || null;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

function formatSession(session) {
  return {
    id: session.id,
    leadId: session.leadId,
    student: session.studentName,
    studentName: session.studentName,
    phone: session.studentPhone,
    email: session.studentEmail,
    course: session.course || "—",
    counsellor: session.counsellorName || "Unassigned",
    counsellorName: session.counsellorName,
    mode: session.mode,
    link: session.meetingLink || "—",
    meetingLink: session.meetingLink,
    accompaniedBy: session.accompaniedBy || "—",
    scheduledAt: session.scheduledAt,
    date: session.scheduledAt,
    status: STATUS_LABELS[session.status] || session.status,
    statusKey: session.status,
    remarks: session.remarks || "—",
    followUpAt: session.followUpAt,
    followUp: session.followUpAt || "—",
    converted: session.converted,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    market: session.market,
  };
}

function buildSummary(rows) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const sessionsToday = rows.filter((item) => {
    const date = new Date(item.scheduledAt);
    return date >= todayStart && date < tomorrowStart;
  }).length;

  const thisWeek = rows.filter((item) => {
    const date = new Date(item.scheduledAt);
    return date >= weekStart && date < weekEnd;
  }).length;

  const conversionRate = rows.length
    ? Number(((rows.filter((item) => item.converted).length / rows.length) * 100).toFixed(1))
    : 0;

  const pendingFollowUps = rows.filter(
    (item) =>
      item.status === "FOLLOW_UP" ||
      (item.followUpAt && item.status !== "COMPLETED" && item.status !== "CANCELLED")
  ).length;

  return { sessionsToday, thisWeek, conversionRate, pendingFollowUps };
}

router.get("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim().toUpperCase();
    const selectedYear = parseYear(req.query.year);
    const market = parseMarket(req.query.market);
    const where = {
      companyId,
      ...(market ? { market } : {}),
      ...(selectedYear ? { scheduledAt: yearRange(selectedYear) } : {}),
    };

    if (status && VALID_STATUSES.includes(status)) where.status = status;

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: "insensitive" } },
        { studentPhone: { contains: search, mode: "insensitive" } },
        { studentEmail: { contains: search, mode: "insensitive" } },
        { course: { contains: search, mode: "insensitive" } },
        { counsellorName: { contains: search, mode: "insensitive" } },
        { mode: { contains: search, mode: "insensitive" } },
      ];
    }

    const [sessions, allSessions] = await Promise.all([
      prisma.counsellingSession.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
      }),
      prisma.counsellingSession.findMany({
        where: { companyId, ...(market ? { market } : {}) },
        select: {
          status: true,
          scheduledAt: true,
          followUpAt: true,
          converted: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      sessions: sessions.map(formatSession),
      summary: buildSummary(allSessions),
    });
  } catch (error) {
    console.error("Failed to fetch counselling sessions:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch counselling sessions",
    });
  }
});

router.get("/eligible-leads", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const leads = await prisma.lead.findMany({
      where: {
        companyId,
        stage: { notIn: ["LOST"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        course: true,
        assignedToName: true,
        stage: true,
      },
      orderBy: { createdAt: "desc" },
      take: 250,
    });

    return res.json({ success: true, leads });
  } catch (error) {
    console.error("Failed to load counselling leads:", error);
    return res.status(500).json({ success: false, message: "Unable to load leads" });
  }
});

router.post("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const leadId = cleanOptional(req.body?.leadId);
    const market = parseMarket(req.body?.market, "DOMESTIC");
    let selectedLead = null;

    if (leadId) {
      selectedLead = await prisma.lead.findFirst({
        where: { id: leadId, companyId },
      });

      if (!selectedLead) {
        return res.status(400).json({
          success: false,
          message: "Selected lead was not found for this company",
        });
      }
    }

    const studentName = String(
      req.body?.studentName || selectedLead?.name || ""
    ).trim();
    const scheduledAt = parseDate(req.body?.scheduledAt);
    const status = String(req.body?.status || "SCHEDULED").trim().toUpperCase();

    if (!studentName) {
      return res.status(400).json({ success: false, message: "Student name is required" });
    }

    if (!scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Valid counselling date and time is required",
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid counselling status" });
    }

    const followUpAt = req.body?.followUpAt ? parseDate(req.body.followUpAt) : null;

    if (req.body?.followUpAt && !followUpAt) {
      return res.status(400).json({ success: false, message: "Invalid follow-up date" });
    }

    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.counsellingSession.create({
        data: {
          companyId,
          market,
          leadId: selectedLead?.id || null,
          studentName,
          studentPhone: cleanOptional(req.body?.studentPhone) || selectedLead?.phone || null,
          studentEmail: (
            cleanOptional(req.body?.studentEmail) || selectedLead?.email || null
          )?.toLowerCase() || null,
          course: cleanOptional(req.body?.course) || selectedLead?.course || null,
          counsellorName:
            cleanOptional(req.body?.counsellorName) || selectedLead?.assignedToName || null,
          mode: String(req.body?.mode || "IN_PERSON").trim().toUpperCase(),
          meetingLink: cleanOptional(req.body?.meetingLink),
          accompaniedBy: cleanOptional(req.body?.accompaniedBy),
          scheduledAt,
          status,
          remarks: cleanOptional(req.body?.remarks),
          followUpAt,
          converted: req.body?.converted === true,
        },
      });

      if (selectedLead && !["ADMITTED", "LOST"].includes(selectedLead.stage)) {
        await tx.lead.update({
          where: { id: selectedLead.id },
          data: { stage: "COUNSELLING" },
        });
      }

      return created;
    });

    return res.status(201).json({
      success: true,
      message: "Counselling session scheduled successfully",
      session: formatSession(session),
    });
  } catch (error) {
    console.error("Failed to schedule counselling session:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to schedule counselling session",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const existing = await prisma.counsellingSession.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Counselling session not found" });
    }

    const data = {};
    if (req.body?.market !== undefined) {
      const market = parseMarket(req.body.market);
      if (!market) return res.status(400).json({ success: false, message: "Invalid admissions market" });
      data.market = market;
    }

    if (req.body?.leadId !== undefined) {
      if (!req.body.leadId) {
        data.leadId = null;
      } else {
        const lead = await prisma.lead.findFirst({
          where: { id: String(req.body.leadId), companyId },
        });
        if (!lead) {
          return res.status(400).json({
            success: false,
            message: "Selected lead was not found for this company",
          });
        }
        data.leadId = lead.id;
      }
    }

    if (req.body?.studentName !== undefined) {
      const studentName = String(req.body.studentName || "").trim();
      if (!studentName) {
        return res.status(400).json({ success: false, message: "Student name is required" });
      }
      data.studentName = studentName;
    }

    for (const field of [
      "studentPhone",
      "studentEmail",
      "course",
      "counsellorName",
      "meetingLink",
      "accompaniedBy",
      "remarks",
    ]) {
      if (req.body?.[field] !== undefined) data[field] = cleanOptional(req.body[field]);
    }

    if (data.studentEmail) data.studentEmail = data.studentEmail.toLowerCase();

    if (req.body?.mode !== undefined) {
      data.mode = String(req.body.mode || "IN_PERSON").trim().toUpperCase();
    }

    if (req.body?.status !== undefined) {
      const status = String(req.body.status || "").trim().toUpperCase();
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid counselling status" });
      }
      data.status = status;
    }

    if (req.body?.scheduledAt !== undefined) {
      const scheduledAt = parseDate(req.body.scheduledAt);
      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          message: "Invalid counselling date and time",
        });
      }
      data.scheduledAt = scheduledAt;
    }

    if (req.body?.followUpAt !== undefined) {
      if (!req.body.followUpAt) {
        data.followUpAt = null;
      } else {
        const followUpAt = parseDate(req.body.followUpAt);
        if (!followUpAt) {
          return res.status(400).json({ success: false, message: "Invalid follow-up date" });
        }
        data.followUpAt = followUpAt;
      }
    }

    if (typeof req.body?.converted === "boolean") data.converted = req.body.converted;

    const updated = await prisma.counsellingSession.update({
      where: { id: existing.id },
      data,
    });

    return res.json({
      success: true,
      message: "Counselling session updated successfully",
      session: formatSession(updated),
    });
  } catch (error) {
    console.error("Failed to update counselling session:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update counselling session",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const session = await prisma.counsellingSession.findFirst({
      where: { id: req.params.id, companyId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: "Counselling session not found" });
    }

    await prisma.counsellingSession.delete({ where: { id: session.id } });
    return res.json({ success: true, message: "Counselling session deleted successfully" });
  } catch (error) {
    console.error("Failed to delete counselling session:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete counselling session",
    });
  }
});

export default router;