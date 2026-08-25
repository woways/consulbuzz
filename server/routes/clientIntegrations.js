import { Router } from "express";

import prisma from "../lib/prisma.js";
import { integrationApiKey } from "../lib/integrationAuth.js";
import {
  requireClientUser,
  requireClientPermission,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

router.use(
  requireClientPermission(
    "canManageSettings",
    "You do not have permission to manage integrations"
  )
);

const PROVIDERS = {
  WEBSITE_API: {
    name: "Website API",
    description:
      "Receive website form leads into ConsulBuzz using a company-specific API integration.",
    category: "Lead Capture",
  },

  GOOGLE_FORMS: {
    name: "Google Forms",
    description:
      "Prepare Google Form lead capture configuration for this workspace.",
    category: "Lead Capture",
  },

  META_LEADS: {
    name: "Meta Lead Ads",
    description:
      "Prepare Facebook and Instagram lead ad connectivity for this workspace.",
    category: "Lead Capture",
  },

  WHATSAPP: {
    name: "WhatsApp",
    description:
      "Prepare WhatsApp Business messaging and lead workflow connectivity.",
    category: "Communication",
  },

  EMAIL_SMTP: {
    name: "Email / SMTP",
    description:
      "Configure non-secret email sender details. Credentials can be connected later.",
    category: "Communication",
  },

  GENERIC_WEBHOOK: {
    name: "Generic Webhook",
    description:
      "Prepare a generic webhook integration for external systems.",
    category: "Automation",
  },
};

const VALID_PROVIDERS =
  Object.keys(PROVIDERS);

const SAFE_CONFIG_KEYS = {
  WEBSITE_API: [
    "websiteName",
    "allowedOrigin",
    "defaultSourceKey",
  ],

  GOOGLE_FORMS: [
    "formName",
    "formId",
    "defaultSourceKey",
  ],

  META_LEADS: [
    "pageName",
    "pageId",
    "formId",
    "defaultSourceKey",
  ],

  WHATSAPP: [
    "businessName",
    "phoneNumber",
    "businessAccountId",
  ],

  EMAIL_SMTP: [
    "senderName",
    "senderEmail",
    "smtpHost",
    "smtpPort",
  ],

  GENERIC_WEBHOOK: [
    "integrationName",
    "externalSystem",
    "defaultSourceKey",
  ],
};

function cleanConfig(
  provider,
  value
) {
  const allowed =
    SAFE_CONFIG_KEYS[
      provider
    ] || [];

  const input =
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
      ? value
      : {};

  const output = {};

  for (const key of allowed) {
    if (
      input[key] ===
      undefined ||
      input[key] ===
      null
    ) {
      continue;
    }

    const cleaned =
      String(
        input[key]
      ).trim();

    if (cleaned) {
      output[key] =
        cleaned;
    }
  }

  return output;
}

function formatIntegration(
  provider,
  record
) {
  const meta =
    PROVIDERS[provider];

  return {
    id:
      record?.id ||
      null,

    provider,

    name:
      record?.displayName ||
      meta.name,

    defaultName:
      meta.name,

    description:
      meta.description,

    category:
      meta.category,

    enabled:
      record?.enabled ||
      false,

    status:
      record?.status ||
      "NOT_CONFIGURED",

    credentialsConfigured:
      record?.credentialsConfigured ||
      false,

    config:
      record?.config &&
      typeof record.config ===
        "object" &&
      !Array.isArray(
        record.config
      )
        ? record.config
        : {},

    lastConnectedAt:
      record?.lastConnectedAt ||
      null,

    lastError:
      record?.lastError ||
      null,

    updatedAt:
      record?.updatedAt ||
      null,
  };
}

async function findCompanyIntegration(
  companyId,
  provider
) {
  return prisma
    .companyIntegration
    .findUnique({
      where: {
        companyId_provider: {
          companyId,
          provider,
        },
      },
    });
}

/* =========================================================
   GET ALL INTEGRATIONS
========================================================= */

router.get(
  "/",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const records =
        await prisma
          .companyIntegration
          .findMany({
            where: {
              companyId,
            },
          });

      const recordMap =
        new Map(
          records.map(
            (record) => [
              record.provider,
              record,
            ]
          )
        );

      return res.json({
        success:
          true,

        integrations:
          VALID_PROVIDERS.map(
            (provider) =>
              formatIntegration(
                provider,
                recordMap.get(
                  provider
                )
              )
          ),
      });
    } catch (error) {
      console.error(
        "Failed to fetch integrations:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to fetch integrations",
        });
    }
  }
);

/* =========================================================
   GET ONE INTEGRATION
========================================================= */

router.get(
  "/:provider",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const provider =
        String(
          req.params
            .provider ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        !VALID_PROVIDERS.includes(
          provider
        )
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Integration not found",
          });
      }

      const record =
        await findCompanyIntegration(
          companyId,
          provider
        );

      return res.json({
        success:
          true,

        integration:
          formatIntegration(
            provider,
            record
          ),
      });
    } catch (error) {
      console.error(
        "Failed to fetch integration:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to fetch integration",
        });
    }
  }
);

/* =========================================================
   SAVE / UPDATE INTEGRATION CONFIG
========================================================= */

router.put(
  "/:provider",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const provider =
        String(
          req.params
            .provider ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        !VALID_PROVIDERS.includes(
          provider
        )
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Integration not found",
          });
      }

      const config =
        cleanConfig(
          provider,
          req.body?.config
        );

      const displayName =
        req.body
          ?.displayName
          ? String(
              req.body
                .displayName
            ).trim()
          : null;

      const existing =
        await findCompanyIntegration(
          companyId,
          provider
        );

      const nextStatus =
        Object.keys(
          config
        ).length > 0
          ? "CONFIGURED"
          : existing
              ?.credentialsConfigured
          ? "CONFIGURED"
          : "NOT_CONFIGURED";

      const integration =
        await prisma
          .companyIntegration
          .upsert({
            where: {
              companyId_provider: {
                companyId,
                provider,
              },
            },

            update: {
              displayName,
              config,
              status:
                existing?.status ===
                  "CONNECTED" &&
                existing
                  ?.credentialsConfigured
                  ? "CONNECTED"
                  : nextStatus,

              lastError:
                null,
            },

            create: {
              companyId,
              provider,
              displayName,
              config,
              status:
                nextStatus,
            },
          });

      return res.json({
        success:
          true,

        message:
          "Integration configuration saved",

        integration:
          formatIntegration(
            provider,
            integration
          ),
      });
    } catch (error) {
      console.error(
        "Failed to save integration:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to save integration",
        });
    }
  }
);


/* =========================================================
   ACCESS DETAILS FOR PUBLIC INGESTION INTEGRATIONS
========================================================= */

router.get(
  "/:provider/access",
  async (req, res) => {
    try {
      const companyId = req.clientUser.companyId;
      const provider = String(req.params.provider || "").trim().toUpperCase();

      if (!["WEBSITE_API", "GENERIC_WEBHOOK"].includes(provider)) {
        return res.status(400).json({
          success: false,
          message: "Access details are only available for Website API and Generic Webhook",
        });
      }

      const integration = await findCompanyIntegration(companyId, provider);

      if (!integration) {
        return res.status(400).json({
          success: false,
          message: "Save the integration configuration first",
        });
      }

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { slug: true },
      });

      if (!company) {
        return res.status(404).json({ success: false, message: "Company not found" });
      }

      let apiKey;
      try {
        apiKey = integrationApiKey(companyId, provider, integration.apiKeyVersion || 1);
      } catch (error) {
        return res.status(503).json({
          success: false,
          message: error.message,
        });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const path =
        provider === "WEBSITE_API"
          ? `/api/integrations/website/${company.slug}/leads`
          : `/api/integrations/webhook/${company.slug}`;

      return res.json({
        success: true,
        access: {
          endpoint: `${baseUrl}${path}`,
          apiKey,
          header: "X-ConsulBuzz-Key",
          method: "POST",
        },
      });
    } catch (error) {
      console.error("Failed to generate integration access details:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to generate integration access details",
      });
    }
  }
);



/* =========================================================
   REGENERATE PUBLIC API KEY
========================================================= */

router.post("/:provider/access/regenerate", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const provider = String(req.params.provider || "").trim().toUpperCase();

    if (!["WEBSITE_API", "GENERIC_WEBHOOK"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "API key regeneration is only available for Website API and Generic Webhook",
      });
    }

    const existing = await findCompanyIntegration(companyId, provider);

    if (!existing) {
      return res.status(400).json({
        success: false,
        message: "Save the integration configuration first",
      });
    }

    const integration = await prisma.companyIntegration.update({
      where: { id: existing.id },
      data: {
        apiKeyVersion: { increment: 1 },
        status: "CONFIGURED",
        lastError: null,
      },
    });

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const path =
      provider === "WEBSITE_API"
        ? `/api/integrations/website/${company.slug}/leads`
        : `/api/integrations/webhook/${company.slug}`;

    return res.json({
      success: true,
      message: "API key regenerated. The previous key is no longer valid.",
      access: {
        endpoint: `${baseUrl}${path}`,
        apiKey: integrationApiKey(
          companyId,
          provider,
          integration.apiKeyVersion || 1
        ),
        header: "X-ConsulBuzz-Key",
        method: "POST",
      },
      integration: formatIntegration(provider, integration),
    });
  } catch (error) {
    console.error("Failed to regenerate integration API key:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to regenerate API key",
    });
  }
});

/* =========================================================
   VERIFY WEBSITE / WEBHOOK SETUP
   This verifies ConsulBuzz-side readiness. CONNECTED is set only
   after a real external request successfully reaches the endpoint.
========================================================= */

router.post("/:provider/verify", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;
    const provider = String(req.params.provider || "").trim().toUpperCase();

    if (!["WEBSITE_API", "GENERIC_WEBHOOK"].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Setup verification is only available for Website API and Generic Webhook",
      });
    }

    const integration = await findCompanyIntegration(companyId, provider);

    if (!integration) {
      return res.status(400).json({
        success: false,
        message: "Save the integration configuration first",
      });
    }

    integrationApiKey(
      companyId,
      provider,
      integration.apiKeyVersion || 1
    );

    const config =
      integration.config &&
      typeof integration.config === "object" &&
      !Array.isArray(integration.config)
        ? integration.config
        : {};

    if (
      provider === "WEBSITE_API" &&
      (!config.websiteName || !config.allowedOrigin)
    ) {
      return res.status(400).json({
        success: false,
        message: "Website Name and Allowed Origin are required before testing setup",
      });
    }

    return res.json({
      success: true,
      ready: true,
      connected: integration.status === "CONNECTED",
      message:
        integration.status === "CONNECTED"
          ? "Website API is connected and has received a successful request."
          : "ConsulBuzz setup is ready. Connect the website and submit a real test lead to mark it Connected.",
      lastConnectedAt: integration.lastConnectedAt || null,
      lastError: integration.lastError || null,
    });
  } catch (error) {
    console.error("Failed to verify integration setup:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Unable to verify integration setup",
    });
  }
});


/* =========================================================
   ENABLE / DISABLE INTEGRATION
========================================================= */

router.patch(
  "/:provider/enabled",
  async (
    req,
    res
  ) => {
    try {
      const companyId =
        req.clientUser
          .companyId;

      const provider =
        String(
          req.params
            .provider ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        !VALID_PROVIDERS.includes(
          provider
        )
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Integration not found",
          });
      }

      const enabled =
        req.body
          ?.enabled ===
        true;

      const existing =
        await findCompanyIntegration(
          companyId,
          provider
        );

      if (
        enabled &&
        !existing
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Configure this integration before enabling it",
          });
      }

      const integration =
        await prisma
          .companyIntegration
          .upsert({
            where: {
              companyId_provider: {
                companyId,
                provider,
              },
            },

            update: {
              enabled,
            },

            create: {
              companyId,
              provider,
              enabled:
                false,
              status:
                "NOT_CONFIGURED",
            },
          });

      return res.json({
        success:
          true,

        message:
          enabled
            ? "Integration enabled"
            : "Integration disabled",

        integration:
          formatIntegration(
            provider,
            integration
          ),
      });
    } catch (error) {
      console.error(
        "Failed to update integration:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,

          message:
            "Unable to update integration",
        });
    }
  }
);

export default router;