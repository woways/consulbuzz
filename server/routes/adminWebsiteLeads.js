import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireSuperAdmin } from "../middleware/adminAuth.js";

const router = Router();
const STATUSES = new Set([
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "DEMO_SCHEDULED",
  "WON",
  "LOST",
]);

router.use(requireSuperAdmin);

function formatLead(lead) {
  return {
    id: lead.id,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    teamSize: lead.teamSize,
    preferredDate: lead.preferredDate,
    preferredTime: lead.preferredTime,
    note: lead.note,
    adminNote: lead.adminNote,
    lastStep: lead.lastStep,
    demoRequested: lead.demoRequested,
    demoRequestedAt: lead.demoRequestedAt,
    status: lead.status,
    contactedAt: lead.contactedAt,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const leads = await prisma.websiteLead.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 1000,
    });

    return res.json({
      success: true,
      leads: leads.map(formatLead),
      summary: {
        total: leads.length,
        new: leads.filter((lead) => lead.status === "NEW").length,
        contacted: leads.filter((lead) => lead.status === "CONTACTED").length,
        followUp: leads.filter((lead) => lead.status === "FOLLOW_UP").length,
        demoRequested: leads.filter((lead) => lead.demoRequested).length,
        won: leads.filter((lead) => lead.status === "WON").length,
      },
    });
  } catch (error) {
    console.error("Fetch website leads failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch website leads",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const current = await prisma.websiteLead.findUnique({
      where: { id: req.params.id },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: "Website lead not found" });
    }

    const data = {};

    if (req.body?.status !== undefined) {
      const status = String(req.body.status || "").trim().toUpperCase();
      if (!STATUSES.has(status)) {
        return res.status(400).json({ success: false, message: "Invalid lead status" });
      }
      data.status = status;
      if (status === "CONTACTED" && !current.contactedAt) data.contactedAt = new Date();
    }

    if (req.body?.adminNote !== undefined) {
      data.adminNote = String(req.body.adminNote || "").trim().slice(0, 2000) || null;
    }

    const lead = await prisma.websiteLead.update({
      where: { id: current.id },
      data,
    });

    return res.json({ success: true, lead: formatLead(lead) });
  } catch (error) {
    console.error("Update website lead failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update website lead",
    });
  }
});

export default router;