import { Router } from "express";

import prisma from "../lib/prisma.js";
import { integrationApiKeyMatches } from "../lib/integrationAuth.js";

const router = Router();

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  const result = clean(value).toLowerCase();
  return result || null;
}

async function findEnabledIntegration(companySlug, provider) {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug },
    select: { id: true, slug: true, name: true },
  });

  if (!company) return null;

  const integration = await prisma.companyIntegration.findUnique({
    where: {
      companyId_provider: {
        companyId: company.id,
        provider,
      },
    },
  });

  if (!integration?.enabled) return null;

  return { company, integration };
}

async function resolveLeadSource(companyId, requestedKey, fallbackKey) {
  const requested = clean(requestedKey || fallbackKey || "OTHER").toUpperCase();

  const source = await prisma.leadSourceConfig.findFirst({
    where: {
      companyId,
      key: requested,
      active: true,
    },
  });

  if (source) return source.key;

  const fallback = await prisma.leadSourceConfig.findFirst({
    where: {
      companyId,
      key: "OTHER",
      active: true,
    },
  });

  return fallback?.key || requested;
}

async function createLeadFromPayload({ company, integration, provider, payload }) {
  const name = clean(payload.name || payload.fullName || payload.studentName);
  const phone = clean(payload.phone || payload.mobile || payload.phoneNumber);
  const email = normalizeEmail(payload.email);

  if (!name || !phone) {
    const error = new Error("name and phone are required");
    error.status = 400;
    throw error;
  }

  const config =
    integration.config && typeof integration.config === "object" && !Array.isArray(integration.config)
      ? integration.config
      : {};

  const source = await resolveLeadSource(
    company.id,
    payload.source,
    config.defaultSourceKey || (provider === "WEBSITE_API" ? "WEBSITE_FORM" : "OTHER")
  );

  const existing = await prisma.lead.findFirst({
    where: {
      companyId: company.id,
      OR: [
        { phone },
        ...(email ? [{ email }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.companyIntegration.update({
      where: { id: integration.id },
      data: {
        status: "CONNECTED",
        lastConnectedAt: new Date(),
        lastError: null,
      },
    });

    return { lead: existing, duplicate: true };
  }

  const lead = await prisma.lead.create({
    data: {
      companyId: company.id,
      name,
      phone,
      email,
      course: clean(payload.course || payload.interest) || null,
      source,
      campaign: clean(payload.campaign || payload.utm_campaign) || null,
      medium: clean(payload.medium || payload.utm_medium) || null,
      assignedToName: clean(payload.assignedToName) || null,
      notes: clean(payload.notes || payload.message) || null,
    },
  });

  await prisma.companyIntegration.update({
    where: { id: integration.id },
    data: {
      status: "CONNECTED",
      lastConnectedAt: new Date(),
      lastError: null,
    },
  });

  return { lead, duplicate: false };
}

async function authenticate(req, res, provider) {
  const companySlug = clean(req.params.companySlug).toLowerCase();
  const found = await findEnabledIntegration(companySlug, provider);

  if (!found) {
    res.status(404).json({
      success: false,
      message: "Integration endpoint is not enabled",
    });
    return null;
  }

  const apiKey = req.get("x-consulbuzz-key");

  try {
    if (!integrationApiKeyMatches(
        found.company.id,
        provider,
        apiKey,
        found.integration.apiKeyVersion || 1
      )) {
      res.status(401).json({
        success: false,
        message: "Invalid integration API key",
      });
      return null;
    }
  } catch (error) {
    console.error("Integration authentication configuration error:", error);
    res.status(503).json({
      success: false,
      message: "Integration authentication is not configured",
    });
    return null;
  }

  return found;
}

router.post("/website/:companySlug/leads", async (req, res) => {
  const found = await authenticate(req, res, "WEBSITE_API");
  if (!found) return;

  try {
    const config =
      found.integration.config && typeof found.integration.config === "object"
        ? found.integration.config
        : {};

    const allowedOrigin = clean(config.allowedOrigin).replace(/\/+$/, "");
    const requestOrigin = clean(req.get("origin")).replace(/\/+$/, "");

    if (allowedOrigin && requestOrigin && allowedOrigin !== requestOrigin) {
      return res.status(403).json({
        success: false,
        message: "Origin is not allowed for this integration",
      });
    }

    const result = await createLeadFromPayload({
      ...found,
      provider: "WEBSITE_API",
      payload: req.body || {},
    });

    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: result.duplicate,
      leadId: result.lead.id,
      message: result.duplicate ? "Lead already exists" : "Lead captured successfully",
    });
  } catch (error) {
    console.error("Website integration lead capture failed:", error);

    await prisma.companyIntegration
      .update({
        where: { id: found.integration.id },
        data: { status: "ERROR", lastError: error.message || "Lead capture failed" },
      })
      .catch(() => {});

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Unable to capture lead",
    });
  }
});

router.post("/webhook/:companySlug", async (req, res) => {
  const found = await authenticate(req, res, "GENERIC_WEBHOOK");
  if (!found) return;

  try {
    const payload = req.body?.lead && typeof req.body.lead === "object" ? req.body.lead : req.body || {};

    const result = await createLeadFromPayload({
      ...found,
      provider: "GENERIC_WEBHOOK",
      payload,
    });

    return res.status(result.duplicate ? 200 : 201).json({
      success: true,
      duplicate: result.duplicate,
      leadId: result.lead.id,
      message: result.duplicate ? "Lead already exists" : "Webhook lead captured successfully",
    });
  } catch (error) {
    console.error("Generic webhook lead capture failed:", error);

    await prisma.companyIntegration
      .update({
        where: { id: found.integration.id },
        data: { status: "ERROR", lastError: error.message || "Webhook processing failed" },
      })
      .catch(() => {});

    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Unable to process webhook",
    });
  }
});

export default router;