import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

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