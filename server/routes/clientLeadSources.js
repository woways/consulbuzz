import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

const DEFAULT_SOURCES = [
  {
    key: "GOOGLE_FORM",
    name: "Google Form",
    description:
      "Leads captured through Google Forms",
    sortOrder: 10,
  },
  {
    key: "WEBSITE_FORM",
    name: "Website Form",
    description:
      "Leads captured through website forms",
    sortOrder: 20,
  },
  {
    key: "IM_LEADS",
    name: "IM Leads",
    description:
      "Inbound / instant messaging leads",
    sortOrder: 30,
  },
  {
    key: "DM_LEADS",
    name: "DM Leads",
    description:
      "Direct message leads",
    sortOrder: 40,
  },
  {
    key: "REFERRAL",
    name: "Referral",
    description:
      "Referral-based leads",
    sortOrder: 50,
  },
  {
    key: "OFFLINE",
    name: "Offline",
    description:
      "Offline campaigns, events and direct sourcing",
    sortOrder: 60,
  },
  {
    key: "OTHER",
    name: "Other",
    description:
      "Other lead sources",
    sortOrder: 70,
  },
];

function sourceKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function formatSource(source) {
  return {
    id: source.id,
    key: source.key,
    name: source.name,
    description:
      source.description,
    active: source.active,
    showInForms:
      source.showInForms,
    system: source.system,
    sortOrder:
      source.sortOrder,
    createdAt:
      source.createdAt,
    updatedAt:
      source.updatedAt,
  };
}

async function ensureDefaults(companyId) {
  const count =
    await prisma.leadSourceConfig.count({
      where: {
        companyId,
      },
    });

  if (count > 0) {
    return;
  }

  await prisma.leadSourceConfig.createMany({
    data:
      DEFAULT_SOURCES.map(
        (source) => ({
          companyId,
          ...source,
          active: true,
          showInForms: true,
          system: true,
        })
      ),
  });
}

function requireSourceManager(
  req,
  res
) {
  const clientUser =
    req.clientUser;

  if (
    !clientUser ||
    !clientUser.userId ||
    !clientUser.companyId
  ) {
    res.status(401).json({
      success: false,
      message:
        "Unauthorized",
    });

    return false;
  }

  // Reading lead sources is allowed for lead forms, but changing the
  // company's source configuration is a Settings-level operation.
  const allowed =
    clientUser.role ===
      "CLIENT_ADMIN" ||
    clientUser.permissions
      ?.canManageSettings ===
      true;

  if (!allowed) {
    res.status(403).json({
      success: false,
      message:
        "You do not have permission to manage lead sources",
    });

    return false;
  }

  return true;
}

/* GET SOURCES */
router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    await ensureDefaults(
      companyId
    );

    const sources =
      await prisma.leadSourceConfig.findMany({
        where: {
          companyId,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return res.json({
      success: true,
      sources:
        sources.map(
          formatSource
        ),
    });
  } catch (error) {
    console.error(
      "Load lead sources failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load lead sources",
    });
  }
});

/* CREATE SOURCE */
router.post("/", async (req, res) => {
  try {
    if (
      !requireSourceManager(
        req,
        res
      )
    ) {
      return;
    }

    const companyId =
      req.clientUser.companyId;

    const name =
      String(
        req.body?.name || ""
      ).trim();

    const key =
      sourceKey(
        req.body?.key ||
          name
      );

    const description =
      req.body?.description
        ? String(
            req.body.description
          ).trim()
        : null;

    const sortOrder =
      Number.isFinite(
        Number(
          req.body?.sortOrder
        )
      )
        ? Number(
            req.body.sortOrder
          )
        : 100;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message:
          "Source name and key are required",
      });
    }

    const duplicate =
      await prisma.leadSourceConfig.findFirst({
        where: {
          companyId,
          OR: [
            {
              key,
            },
            {
              name: {
                equals:
                  name,
                mode:
                  "insensitive",
              },
            },
          ],
        },
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A lead source with this name or key already exists",
      });
    }

    const source =
      await prisma.leadSourceConfig.create({
        data: {
          companyId,
          key,
          name,
          description,
          active:
            req.body?.active !==
            false,
          showInForms:
            req.body?.showInForms !==
            false,
          system: false,
          sortOrder,
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Lead source created successfully",
      source:
        formatSource(source),
    });
  } catch (error) {
    console.error(
      "Create lead source failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create lead source",
    });
  }
});

/* UPDATE SOURCE */
router.patch("/:id", async (req, res) => {
  try {
    if (
      !requireSourceManager(
        req,
        res
      )
    ) {
      return;
    }

    const companyId =
      req.clientUser.companyId;

    const existing =
      await prisma.leadSourceConfig.findFirst({
        where: {
          id: req.params.id,
          companyId,
        },
      });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message:
          "Lead source not found",
      });
    }

    const data = {};

    if (
      req.body.name !==
      undefined
    ) {
      const name =
        String(
          req.body.name || ""
        ).trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Source name is required",
        });
      }

      data.name = name;
    }

    if (
      req.body.key !==
      undefined
    ) {
      const key =
        sourceKey(
          req.body.key
        );

      if (!key) {
        return res.status(400).json({
          success: false,
          message:
            "Source key is required",
        });
      }

      data.key = key;
    }

    if (
      data.name ||
      data.key
    ) {
      const duplicate =
        await prisma.leadSourceConfig.findFirst({
          where: {
            companyId,
            id: {
              not: existing.id,
            },
            OR: [
              data.key
                ? {
                    key:
                      data.key,
                  }
                : {
                    key:
                      existing.key,
                  },
              data.name
                ? {
                    name: {
                      equals:
                        data.name,
                      mode:
                        "insensitive",
                    },
                  }
                : {
                    name: {
                      equals:
                        existing.name,
                      mode:
                        "insensitive",
                    },
                  },
            ],
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "A lead source with this name or key already exists",
        });
      }
    }

    if (
      req.body.description !==
      undefined
    ) {
      data.description =
        req.body.description
          ? String(
              req.body.description
            ).trim()
          : null;
    }

    if (
      typeof req.body.active ===
      "boolean"
    ) {
      data.active =
        req.body.active;
    }

    if (
      typeof req.body.showInForms ===
      "boolean"
    ) {
      data.showInForms =
        req.body.showInForms;
    }

    if (
      req.body.sortOrder !==
      undefined
    ) {
      const sortOrder =
        Number(
          req.body.sortOrder
        );

      if (
        !Number.isFinite(
          sortOrder
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sort order",
        });
      }

      data.sortOrder =
        sortOrder;
    }

    const source =
      await prisma.leadSourceConfig.update({
        where: {
          id: existing.id,
        },
        data,
      });

    return res.json({
      success: true,
      message:
        "Lead source updated successfully",
      source:
        formatSource(source),
    });
  } catch (error) {
    console.error(
      "Update lead source failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update lead source",
    });
  }
});

/* DELETE CUSTOM SOURCE */
router.delete("/:id", async (req, res) => {
  try {
    if (
      !requireSourceManager(
        req,
        res
      )
    ) {
      return;
    }

    const companyId =
      req.clientUser.companyId;

    const source =
      await prisma.leadSourceConfig.findFirst({
        where: {
          id: req.params.id,
          companyId,
        },
      });

    if (!source) {
      return res.status(404).json({
        success: false,
        message:
          "Lead source not found",
      });
    }

    if (source.system) {
      return res.status(400).json({
        success: false,
        message:
          "Default lead sources cannot be deleted. Disable them instead.",
      });
    }

    const inUse =
      await prisma.lead.count({
        where: {
          companyId,
          source:
            source.key,
        },
      });

    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message:
          "This source is already used by leads. Disable it instead of deleting it.",
      });
    }

    await prisma.leadSourceConfig.delete({
      where: {
        id: source.id,
      },
    });

    return res.json({
      success: true,
      message:
        "Lead source deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete lead source failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete lead source",
    });
  }
});

export default router;