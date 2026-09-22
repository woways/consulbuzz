import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value, max = 300) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function nullable(value, max = 300) {
  const cleaned = text(value, max);
  return cleaned || null;
}

function validPhone(value) {
  return String(value || "").replace(/\D/g, "").length >= 7;
}

function parsePreferredDate(value) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = text(body.sessionId, 160);
    const fullName = text(body.fullName, 120);
    const email = text(body.email, 180).toLowerCase();
    const phone = text(body.phone, 40);
    const lastStep = Math.min(3, Math.max(1, Number(body.lastStep) || 1));
    const wantsDemo = body.demoRequested === true;

    const fields = {};
    if (sessionId.length < 8) fields.sessionId = "Invalid lead session";
    if (fullName.length < 2) fields.fullName = "Enter your name";
    if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email";
    if (!validPhone(phone)) fields.phone = "Enter a valid phone number";

    if (Object.keys(fields).length) {
      return res.status(400).json({
        success: false,
        message: "Please check your contact details",
        fields,
      });
    }

    const preferredDate = parsePreferredDate(body.preferredDate);
    const preferredTime = nullable(body.preferredTime, 80);

    if (wantsDemo && (!preferredDate || !preferredTime)) {
      return res.status(400).json({
        success: false,
        message: "Choose a preferred demo date and time",
        fields: {
          ...(preferredDate ? {} : { preferredDate: "Choose a date" }),
          ...(preferredTime ? {} : { preferredTime: "Choose a time" }),
        },
      });
    }

    const existing = await prisma.websiteLead.findUnique({
      where: { sessionId },
    });

    const common = {
      fullName,
      email,
      phone,
      companyName: nullable(body.companyName, 180),
      teamSize: nullable(body.teamSize, 60),
      preferredDate,
      preferredTime,
      note: nullable(body.note, 1500),
    };

    const lead = existing
      ? await prisma.websiteLead.update({
          where: { id: existing.id },
          data: {
            ...common,
            lastStep: Math.max(existing.lastStep || 1, lastStep),
            demoRequested: existing.demoRequested || wantsDemo,
            demoRequestedAt:
              existing.demoRequestedAt || (wantsDemo ? new Date() : null),
          },
        })
      : await prisma.websiteLead.create({
          data: {
            sessionId,
            ...common,
            lastStep,
            demoRequested: wantsDemo,
            demoRequestedAt: wantsDemo ? new Date() : null,
          },
        });

    return res.json({
      success: true,
      lead: {
        id: lead.id,
        status: lead.status,
        lastStep: lead.lastStep,
        demoRequested: lead.demoRequested,
      },
    });
  } catch (error) {
    console.error("Save website lead failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save your details right now",
    });
  }
});

export default router;