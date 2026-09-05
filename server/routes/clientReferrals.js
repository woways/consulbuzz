import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Map the lead's stage to a referral progress index (0-based) out of 5 stages.
const STAGE_ORDER = ["NEW", "CONTACTED", "QUALIFIED", "COUNSELLING", "ADMITTED"];

function stageIndex(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  return i === -1 ? 0 : i; // LOST or unknown -> treat as start
}

// Generate a referral code from the user's name + a short random suffix.
function makeCode(name) {
  const base = String(name || "USER")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "USER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

// Ensure the current user has a referral code; create one if missing.
async function ensureCode(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, referralCode: true },
  });
  if (!user) return null;
  if (user.referralCode) return user.referralCode;

  // Try a few times in case of a unique collision.
  for (let i = 0; i < 5; i += 1) {
    const code = makeCode(user.name);
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode;
    } catch (e) {
      // unique conflict -> retry
    }
  }
  return null;
}

function formatReferral(ref) {
  const lead = ref.lead || {};
  const stage = lead.stage || "NEW";
  return {
    id: ref.id,
    createdAt: ref.createdAt,
    lead: {
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      course: lead.course,
      stage,
      stageIndex: stageIndex(stage),
      isLost: stage === "LOST",
    },
  };
}

async function canViewTeam(req) {
  if (req.clientUser.role === "CLIENT_ADMIN") return true;
  const actor = await prisma.user.findUnique({
    where: { id: req.clientUser.userId },
    select: { canViewTeamTargets: true, active: true, companyId: true },
  });
  return Boolean(
    actor &&
      actor.active &&
      actor.companyId === req.clientUser.companyId &&
      actor.canViewTeamTargets
  );
}

/* ------------------------------------------------------------------ */
/* GET /me — my referral code + link + my referrals with live stages  */
/* ------------------------------------------------------------------ */

router.get("/me", async (req, res) => {
  try {
    const code = await ensureCode(req.clientUser.userId);

    const referrals = await prisma.referral.findMany({
      where: {
        companyId: req.clientUser.companyId,
        referrerId: req.clientUser.userId,
      },
      include: { lead: true },
      orderBy: { createdAt: "desc" },
    });

    const formatted = referrals.map(formatReferral);

    // Simple stats.
    const total = formatted.length;
    const admitted = formatted.filter((r) => r.lead.stage === "ADMITTED").length;
    const inProgress = formatted.filter(
      (r) => !["ADMITTED", "LOST"].includes(r.lead.stage)
    ).length;

    return res.json({
      success: true,
      code,
      referrals: formatted,
      stats: { total, admitted, inProgress },
      stageOrder: STAGE_ORDER,
    });
  } catch (error) {
    console.error("Failed to load referrals:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load referrals" });
  }
});

/* ------------------------------------------------------------------ */
/* POST /tag — tag an existing lead as referred by a user             */
/* Body: { leadId, referrerId? }  (referrerId defaults to self;       */
/* tagging on behalf of someone else needs team permission)           */
/* ------------------------------------------------------------------ */

router.post("/tag", async (req, res) => {
  try {
    const leadId = String(req.body?.leadId || "");
    if (!leadId) {
      return res
        .status(400)
        .json({ success: false, message: "leadId is required" });
    }

    // Lead must be in the same company.
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId: req.clientUser.companyId },
      select: { id: true },
    });
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Determine referrer.
    let referrerId = req.clientUser.userId;
    const requested = String(req.body?.referrerId || "").trim();
    if (requested && requested !== req.clientUser.userId) {
      const allowed = await canViewTeam(req);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You cannot tag referrals for other users",
        });
      }
      const referrer = await prisma.user.findFirst({
        where: {
          id: requested,
          companyId: req.clientUser.companyId,
          active: true,
        },
        select: { id: true },
      });
      if (!referrer) {
        return res
          .status(404)
          .json({ success: false, message: "Referrer not found" });
      }
      referrerId = requested;
    }

    // A lead can only be referred once (leadId is unique on Referral).
    const existing = await prisma.referral.findUnique({ where: { leadId } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "This lead is already referred" });
    }

    const ref = await prisma.referral.create({
      data: {
        companyId: req.clientUser.companyId,
        referrerId,
        leadId,
      },
      include: { lead: true },
    });

    return res.json({ success: true, referral: formatReferral(ref) });
  } catch (error) {
    console.error("Failed to tag referral:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to tag referral" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /users — company users to tag referrals to (permission gated)  */
/* ------------------------------------------------------------------ */

router.get("/users", async (req, res) => {
  try {
    const allowed = await canViewTeam(req);
    if (!allowed) {
      return res
        .status(403)
        .json({ success: false, message: "Not allowed" });
    }
    const users = await prisma.user.findMany({
      where: { companyId: req.clientUser.companyId, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return res.json({ success: true, users });
  } catch (error) {
    console.error("Failed to load users:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load users" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /leads?q= — search company leads not yet referred (for picker)  */
/* ------------------------------------------------------------------ */

router.get("/leads", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();

    const leads = await prisma.lead.findMany({
      where: {
        companyId: req.clientUser.companyId,
        referral: null, // not already referred
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, phone: true, email: true, course: true, stage: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return res.json({ success: true, leads });
  } catch (error) {
    console.error("Failed to search leads:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to search leads" });
  }
});

export default router;