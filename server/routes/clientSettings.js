import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";
import {
  writeAuditLog,
} from "../lib/auditLog.js";

const router = Router();

router.use(requireClientUser);

const ALLOWED_COLORS = [
  "indigo",
  "emerald",
  "amber",
  "rose",
  "purple",
  "sky",
];

async function getActor(req) {
  return prisma.user.findUnique({
    where: {
      id:
        req.clientUser.userId,
    },
  });
}

async function canManageSettings(req) {
  const actor =
    await getActor(req);

  if (
    !actor ||
    !actor.active ||
    actor.companyId !==
      req.clientUser.companyId
  ) {
    return null;
  }

  if (
    actor.role !==
      "CLIENT_ADMIN" &&
    !actor.canManageSettings
  ) {
    return null;
  }

  return actor;
}

function normalizeSubdomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

function shortNameFromCompany(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function formatWorkspace(company) {
  return {
    companyName:
      company.name,

    businessType:
      company.business ||
      "",

    subdomain:
      company.subdomain ||
      "",

    portalName:
      company.settings
        ?.portalName ||
      company.brandName ||
      company.name,

    primaryColor:
      company.settings
        ?.primaryColor ||
      company.primaryColor ||
      "indigo",

    logoUrl:
      company.settings
        ?.logoUrl ||
      company.logoUrl ||
      "",

    secondaryColor:
      company.settings
        ?.secondaryColor ||
      null,

    timezone:
      company.settings
        ?.timezone ||
      "Asia/Kolkata",

    currency:
      company.settings
        ?.currency ||
      "INR",

    dateFormat:
      company.settings
        ?.dateFormat ||
      "DD/MM/YYYY",
  };
}

async function getCompany(companyId) {
  return prisma.company.findUnique({
    where: {
      id: companyId,
    },

    include: {
      settings: true,
    },
  });
}

router.get("/", async (req, res) => {
  try {
    const company =
      await getCompany(
        req.clientUser.companyId
      );

    if (!company) {
      return res.status(404).json({
        success: false,
        message:
          "Company not found",
      });
    }

    return res.json({
      success: true,
      workspace:
        formatWorkspace(
          company
        ),
    });
  } catch (error) {
    console.error(
      "Load client settings failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load company settings",
    });
  }
});

router.patch("/", async (req, res) => {
  try {
    const actor =
      await canManageSettings(req);

    if (!actor) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage company settings",
      });
    }

    const companyId =
      req.clientUser.companyId;

    const existing =
      await getCompany(
        companyId
      );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Company not found",
      });
    }

    const before =
      formatWorkspace(
        existing
      );

    const companyName =
      String(
        req.body?.companyName ||
          ""
      ).trim();

    const businessType =
      String(
        req.body?.businessType ||
          ""
      ).trim();

    const subdomain =
      normalizeSubdomain(
        req.body?.subdomain
      );

    const portalName =
      String(
        req.body?.portalName ||
          ""
      ).trim();

    const primaryColor =
      String(
        req.body?.primaryColor ||
          "indigo"
      )
        .trim()
        .toLowerCase();

    const logoUrl =
      String(
        req.body?.logoUrl ||
          ""
      ).trim();

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message:
          "Company name is required",
      });
    }

    if (!portalName) {
      return res.status(400).json({
        success: false,
        message:
          "Portal name is required",
      });
    }

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message:
          "Subdomain is required",
      });
    }

    if (
      !ALLOWED_COLORS.includes(
        primaryColor
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid primary color",
      });
    }

    if (
      logoUrl &&
      !logoUrl.startsWith(
        "data:image/"
      ) &&
      !/^https?:\/\//i.test(
        logoUrl
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Logo must be an uploaded image or a valid HTTP/HTTPS URL",
      });
    }

    if (
      logoUrl.startsWith(
        "data:image/"
      ) &&
      logoUrl.length >
        750000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Logo is too large. Please use an image below 500 KB.",
      });
    }

    const subdomainOwner =
      await prisma.company.findFirst({
        where: {
          subdomain,
          id: {
            not:
              companyId,
          },
        },

        select: {
          id: true,
        },
      });

    if (subdomainOwner) {
      return res.status(409).json({
        success: false,
        message:
          "This subdomain is already being used by another company",
      });
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.company.update({
          where: {
            id: companyId,
          },

          data: {
            name:
              companyName,

            shortName:
              shortNameFromCompany(
                companyName
              ),

            business:
              businessType ||
              null,

            subdomain,

            brandName:
              portalName,

            primaryColor,

            logoUrl:
              logoUrl ||
              null,
          },
        });

        await tx.companySettings.upsert({
          where: {
            companyId,
          },

          update: {
            portalName,
            primaryColor,
            logoUrl:
              logoUrl ||
              null,
          },

          create: {
            companyId,
            portalName,
            primaryColor,
            logoUrl:
              logoUrl ||
              null,

            timezone:
              existing.settings
                ?.timezone ||
              "Asia/Kolkata",

            currency:
              existing.settings
                ?.currency ||
              "INR",

            dateFormat:
              existing.settings
                ?.dateFormat ||
              "DD/MM/YYYY",

            emailNotifications:
              existing.settings
                ?.emailNotifications ??
              true,

            smsNotifications:
              existing.settings
                ?.smsNotifications ??
              false,
          },
        });
      }
    );

    const updated =
      await getCompany(
        companyId
      );

    const after =
      formatWorkspace(
        updated
      );

    const changedFields =
      Object.keys(after).filter(
        (key) =>
          String(
            before[key] ?? ""
          ) !==
          String(
            after[key] ?? ""
          )
      );

    if (
      changedFields.length >
      0
    ) {
      await writeAuditLog({
        req,
        companyId,
        actor,
        action:
          "WORKSPACE_SETTINGS_UPDATED",
        entityType:
          "COMPANY",
        entityId:
          companyId,
        summary:
          `${actor.name} updated company or branding settings.`,
        metadata: {
          changedFields,
          before: {
            companyName:
              before.companyName,
            businessType:
              before.businessType,
            subdomain:
              before.subdomain,
            portalName:
              before.portalName,
            primaryColor:
              before.primaryColor,
            logoConfigured:
              Boolean(
                before.logoUrl
              ),
          },
          after: {
            companyName:
              after.companyName,
            businessType:
              after.businessType,
            subdomain:
              after.subdomain,
            portalName:
              after.portalName,
            primaryColor:
              after.primaryColor,
            logoConfigured:
              Boolean(
                after.logoUrl
              ),
          },
        },
      });
    }

    return res.json({
      success: true,

      message:
        "Company and branding settings saved successfully",

      workspace:
        after,

      reloadRequired:
        false,
    });
  } catch (error) {
    console.error(
      "Save client settings failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to save company settings",
    });
  }
});
router.patch("/sidebar-order", async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: "order must be an array",
      });
    }

    const clean = order
      .filter((k) => typeof k === "string")
      .slice(0, 50);

    await prisma.user.update({
      where: { id: req.clientUser.userId },
      data: { sidebarOrder: clean },
    });

    return res.json({ success: true, sidebarOrder: clean });
  } catch (error) {
    console.error("Failed to save sidebar order:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save sidebar order",
    });
  }
});

export default router;