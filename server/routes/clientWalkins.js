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
    "canManageAdmissions",
    "You do not have permission to manage walk-ins"
  )
);

const VALID_STATUSES = ["NEW", "IN_PROGRESS", "CONVERTED", "LOST"];

const STATUS_LABELS = {
  NEW: "New",
  IN_PROGRESS: "In Progress",
  CONVERTED: "Converted",
  LOST: "Lost",
};

function cleanOptional(value) {
  const clean = String(value || "").trim();
  return clean || null;
}

function parseDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatWalkIn(walkIn) {
  return {
    id: walkIn.id,
    name: walkIn.visitorName,
    visitorName: walkIn.visitorName,
    phone: walkIn.phone,
    email: walkIn.email,
    course: walkIn.course,
    purpose: walkIn.purpose,
    accompaniedBy: walkIn.accompaniedBy || "—",
    counsellor: walkIn.counsellorName || "Unassigned",
    counsellorName: walkIn.counsellorName,
    outcome: walkIn.outcome || "—",
    status: STATUS_LABELS[walkIn.status] || walkIn.status,
    statusKey: walkIn.status,
    arrivedAt: walkIn.arrivedAt,
    convertedLeadId: walkIn.convertedLeadId,
    createdAt: walkIn.createdAt,
    updatedAt: walkIn.updatedAt,
  };
}

function buildSummary(rows) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = rows.filter((item) => new Date(item.arrivedAt) >= monthStart);

  return {
    total: thisMonth.length,
    converted: thisMonth.filter((item) => item.status === "CONVERTED").length,
    inProgress: thisMonth.filter(
      (item) => item.status === "NEW" || item.status === "IN_PROGRESS"
    ).length,
    lost: thisMonth.filter((item) => item.status === "LOST").length,
  };
}

router.get("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim().toUpperCase();
    const selectedYear = parseYear(req.query.year);
    const where = {
      companyId,
      ...(selectedYear ? { arrivedAt: yearRange(selectedYear) } : {}),
    };

    if (status && VALID_STATUSES.includes(status)) where.status = status;

    if (search) {
      where.OR = [
        { visitorName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { course: { contains: search, mode: "insensitive" } },
        { purpose: { contains: search, mode: "insensitive" } },
        { counsellorName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [rows, allRows] = await Promise.all([
      prisma.walkIn.findMany({ where, orderBy: { arrivedAt: "desc" } }),
      prisma.walkIn.findMany({
        where: { companyId },
        select: { status: true, arrivedAt: true },
      }),
    ]);

    return res.json({
      success: true,
      walkIns: rows.map(formatWalkIn),
      summary: buildSummary(allRows),
    });
  } catch (error) {
    console.error("Failed to fetch walk-ins:", error);
    return res.status(500).json({ success: false, message: "Unable to fetch walk-ins" });
  }
});

router.post("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const visitorName = String(req.body?.visitorName || req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const purpose = String(req.body?.purpose || "").trim();
    const status = String(req.body?.status || "NEW").trim().toUpperCase();
    const arrivedAt = parseDate(req.body?.arrivedAt, new Date());

    if (!visitorName) return res.status(400).json({ success: false, message: "Visitor name is required" });
    if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });
    if (!purpose) return res.status(400).json({ success: false, message: "Purpose is required" });
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid walk-in status" });
    if (!arrivedAt) return res.status(400).json({ success: false, message: "Invalid arrival date" });

    const walkIn = await prisma.walkIn.create({
      data: {
        companyId,
        visitorName,
        phone,
        email: cleanOptional(req.body?.email)?.toLowerCase() || null,
        course: cleanOptional(req.body?.course),
        purpose,
        accompaniedBy: cleanOptional(req.body?.accompaniedBy),
        counsellorName: cleanOptional(req.body?.counsellorName),
        outcome: cleanOptional(req.body?.outcome),
        status,
        arrivedAt,
      },
    });

    return res.status(201).json({ success: true, message: "Walk-in logged successfully", walkIn: formatWalkIn(walkIn) });
  } catch (error) {
    console.error("Failed to create walk-in:", error);
    return res.status(500).json({ success: false, message: "Unable to create walk-in" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const existing = await prisma.walkIn.findFirst({ where: { id: req.params.id, companyId } });

    if (!existing) return res.status(404).json({ success: false, message: "Walk-in not found" });

    const data = {};

    if (req.body?.visitorName !== undefined || req.body?.name !== undefined) {
      const visitorName = String(req.body?.visitorName ?? req.body?.name ?? "").trim();
      if (!visitorName) return res.status(400).json({ success: false, message: "Visitor name is required" });
      data.visitorName = visitorName;
    }

    if (req.body?.phone !== undefined) {
      const phone = String(req.body.phone || "").trim();
      if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });
      data.phone = phone;
    }

    if (req.body?.purpose !== undefined) {
      const purpose = String(req.body.purpose || "").trim();
      if (!purpose) return res.status(400).json({ success: false, message: "Purpose is required" });
      data.purpose = purpose;
    }

    for (const field of ["email", "course", "accompaniedBy", "counsellorName", "outcome"]) {
      if (req.body?.[field] !== undefined) data[field] = cleanOptional(req.body[field]);
    }

    if (data.email) data.email = data.email.toLowerCase();

    if (req.body?.status !== undefined) {
      const status = String(req.body.status || "").trim().toUpperCase();
      if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid walk-in status" });
      data.status = status;
    }

    if (req.body?.arrivedAt !== undefined) {
      const arrivedAt = parseDate(req.body.arrivedAt);
      if (!arrivedAt) return res.status(400).json({ success: false, message: "Invalid arrival date" });
      data.arrivedAt = arrivedAt;
    }

    const updated = await prisma.walkIn.update({ where: { id: existing.id }, data });
    return res.json({ success: true, message: "Walk-in updated successfully", walkIn: formatWalkIn(updated) });
  } catch (error) {
    console.error("Failed to update walk-in:", error);
    return res.status(500).json({ success: false, message: "Unable to update walk-in" });
  }
});

router.post("/:id/convert-to-lead", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const walkIn = await prisma.walkIn.findFirst({ where: { id: req.params.id, companyId } });

    if (!walkIn) return res.status(404).json({ success: false, message: "Walk-in not found" });
    if (walkIn.convertedLeadId) return res.status(409).json({ success: false, message: "This walk-in is already converted to a lead" });

    const lead = await prisma.$transaction(async (tx) => {
      await tx.leadSourceConfig.upsert({
        where: { companyId_key: { companyId, key: "OFFLINE" } },
        update: { active: true, showInForms: true },
        create: {
          companyId,
          key: "OFFLINE",
          name: "Offline / Walk-in",
          description: "Leads created from office walk-ins",
          active: true,
          showInForms: true,
          system: true,
          sortOrder: 90,
        },
      });

      const createdLead = await tx.lead.create({
        data: {
          companyId,
          name: walkIn.visitorName,
          phone: walkIn.phone,
          email: walkIn.email,
          course: walkIn.course,
          source: "OFFLINE",
          stage: "NEW",
          assignedToName: walkIn.counsellorName,
          notes: [
            `Converted from walk-in: ${walkIn.purpose}`,
            walkIn.outcome ? `Outcome: ${walkIn.outcome}` : null,
          ].filter(Boolean).join("\n"),
        },
      });

      await tx.walkIn.update({
        where: { id: walkIn.id },
        data: {
          status: "CONVERTED",
          convertedLeadId: createdLead.id,
          outcome: walkIn.outcome || "Converted to CRM lead",
        },
      });

      return createdLead;
    });

    return res.json({
      success: true,
      message: "Walk-in converted to lead successfully",
      lead: { id: lead.id, name: lead.name, phone: lead.phone, stage: lead.stage },
    });
  } catch (error) {
    console.error("Failed to convert walk-in:", error);
    return res.status(500).json({ success: false, message: "Unable to convert walk-in to lead" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const walkIn = await prisma.walkIn.findFirst({ where: { id: req.params.id, companyId } });
    if (!walkIn) return res.status(404).json({ success: false, message: "Walk-in not found" });
    await prisma.walkIn.delete({ where: { id: walkIn.id } });
    return res.json({ success: true, message: "Walk-in deleted successfully" });
  } catch (error) {
    console.error("Failed to delete walk-in:", error);
    return res.status(500).json({ success: false, message: "Unable to delete walk-in" });
  }
});

export default router;