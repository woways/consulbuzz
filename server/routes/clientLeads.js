import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
  requireClientPermission,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

router.use(
  requireClientPermission(
    "canManageLeads",
    "You do not have permission to access leads"
  )
);

const STAGE_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  COUNSELLING: "Counselling",
  ADMITTED: "Admitted",
  LOST: "Lost",
};

const VALID_STAGES = Object.keys(STAGE_LABELS);

const FALLBACK_SOURCE_LABELS = {
  GOOGLE_FORM: "Google Form",
  WEBSITE_FORM: "Website Form",
  IM_LEADS: "IM Leads",
  DM_LEADS: "DM Leads",
  REFERRAL: "Referral",
  OFFLINE: "Offline",
  OTHER: "Other",
};

async function getSourceMap(
  companyId
) {
  const rows =
    await prisma.leadSourceConfig.findMany({
      where: {
        companyId,
      },
      select: {
        key: true,
        name: true,
      },
    });

  return new Map(
    rows.map(
      (row) => [
        row.key,
        row.name,
      ]
    )
  );
}

async function validateSource(
  companyId,
  sourceKey
) {
  return prisma.leadSourceConfig.findFirst({
    where: {
      companyId,
      key: sourceKey,
      active: true,
    },
  });
}


function normalizeCustomFieldInput(value) {
  if (!value) {
    return {};
  }

  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter((item) => item && item.key)
        .map((item) => [
          String(item.key).trim().toUpperCase(),
          item.value,
        ])
    );
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, fieldValue]) => [
        String(key).trim().toUpperCase(),
        fieldValue,
      ])
    );
  }

  return {};
}

function serializeCustomFieldValue(field, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (field.fieldType === "CHECKBOX") {
    return value === true ||
      String(value).toLowerCase() === "true"
      ? "true"
      : "false";
  }

  if (field.fieldType === "NUMBER") {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      throw new Error(`${field.name} must be a valid number`);
    }

    return String(number);
  }

  if (field.fieldType === "DROPDOWN") {
    const cleanValue = String(value).trim();
    const options = Array.isArray(field.options)
      ? field.options.map((item) => String(item))
      : [];

    if (!options.includes(cleanValue)) {
      throw new Error(`${field.name} has an invalid option`);
    }

    return cleanValue;
  }

  if (field.fieldType === "DATE") {
    const cleanValue = String(value).trim();

    if (
      cleanValue &&
      Number.isNaN(new Date(cleanValue).getTime())
    ) {
      throw new Error(`${field.name} must be a valid date`);
    }

    return cleanValue;
  }

  return String(value).trim();
}

async function prepareCustomFieldValues(
  companyId,
  customFields,
  { requireMissing = false } = {}
) {
  const input = normalizeCustomFieldInput(customFields);

  const fields = await prisma.customField.findMany({
    where: {
      companyId,
      entityType: "LEAD",
      active: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  const values = [];

  for (const field of fields) {
    const hasValue = Object.prototype.hasOwnProperty.call(
      input,
      field.key
    );

    const rawValue = input[field.key];

    if (
      field.required &&
      requireMissing &&
      (!hasValue ||
        rawValue === "" ||
        rawValue === null ||
        rawValue === undefined)
    ) {
      throw new Error(`${field.name} is required`);
    }

    if (!hasValue) {
      continue;
    }

    const value = serializeCustomFieldValue(
      field,
      rawValue
    );

    if (
      field.required &&
      (value === null || value === "")
    ) {
      throw new Error(`${field.name} is required`);
    }

    values.push({
      field,
      value,
    });
  }

  return values;
}

async function saveCustomFieldValues(
  leadId,
  preparedValues
) {
  for (const item of preparedValues) {
    if (item.value === null || item.value === "") {
      await prisma.customFieldValue.deleteMany({
        where: {
          leadId,
          customFieldId: item.field.id,
        },
      });

      continue;
    }

    await prisma.customFieldValue.upsert({
      where: {
        customFieldId_leadId: {
          customFieldId: item.field.id,
          leadId,
        },
      },
      update: {
        value: item.value,
      },
      create: {
        customFieldId: item.field.id,
        leadId,
        value: item.value,
      },
    });
  }
}

function formatLead(lead, sourceMap = new Map()) {
  return {
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    course: lead.course,

    source: sourceMap.get(lead.source) || FALLBACK_SOURCE_LABELS[lead.source] || lead.source,
    sourceKey: lead.source,

    stage: STAGE_LABELS[lead.stage] || lead.stage,
    stageKey: lead.stage,

    campaign: lead.campaign,
    medium: lead.medium,

    assigned:
      lead.assignedToName || "Unassigned",

    notes: lead.notes,

    utmLinkId: lead.utmLinkId,

    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,

    customFields: (lead.customFieldValues || []).map(
      (item) => ({
        id: item.customField.id,
        key: item.customField.key,
        name: item.customField.name,
        fieldType: item.customField.fieldType,
        value: item.value,
        options: Array.isArray(item.customField.options)
          ? item.customField.options
          : [],
      })
    ),
  };
}

function formatLink(link) {
  return {
    id: link.id,
    campaign: link.campaign,
    source: link.source,
    medium: link.medium,
    url: link.url,

    clicks: link.clicks,
    regs: link.registrations,

    leads: link._count?.leads || 0,

    conv: link.conversions,
    adm: link.admissions,

    rev: Number(link.revenue),

    active: link.active,

    createdAt: link.createdAt,
  };
}

/* =========================================================
   GET LEADS FOR LOGGED-IN COMPANY
========================================================= */

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const source =
      String(req.query.source || "")
        .trim()
        .toUpperCase();

    const stage =
      String(req.query.stage || "")
        .trim()
        .toUpperCase();

    const search =
      String(req.query.search || "")
        .trim();

    const where = {
      companyId,
    };

    if (source) {
      where.source = source;
    }

    if (
      stage &&
      VALID_STAGES.includes(stage)
    ) {
      where.stage = stage;
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          course: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          campaign: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const leads =
      await prisma.lead.findMany({
        where,

        include: {
          customFieldValues: {
            include: {
              customField: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const sourceMap =
      await getSourceMap(
        companyId
      );

    return res.json({
      success: true,
      leads:
        leads.map(
          (lead) =>
            formatLead(
              lead,
              sourceMap
            )
        ),
    });
  } catch (error) {
    console.error(
      "Failed to fetch client leads:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch leads",
    });
  }
});

/* =========================================================
   CREATE LEAD
========================================================= */

router.post("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const {
      name,
      phone,
      email,
      course,
      source,
      stage,
      campaign,
      medium,
      assignedToName,
      notes,
      utmLinkId,
      customFields,
    } = req.body || {};

    const cleanName =
      String(name || "").trim();

    const cleanPhone =
      String(phone || "").trim();

    const sourceKey =
      String(source || "")
        .trim()
        .toUpperCase();

    const stageKey =
      String(stage || "NEW")
        .trim()
        .toUpperCase();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Lead name is required",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const sourceConfig =
      await validateSource(
        companyId,
        sourceKey
      );

    if (!sourceConfig) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or inactive lead source",
      });
    }

    if (
      !VALID_STAGES.includes(stageKey)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead stage",
      });
    }

    let validUtmLinkId = null;

    if (utmLinkId) {
      const link =
        await prisma.utmLink.findFirst({
          where: {
            id: String(utmLinkId),
            companyId,
          },
        });

      if (!link) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid UTM link for this company",
        });
      }

      validUtmLinkId = link.id;
    }

    let preparedCustomFields = [];

    try {
      preparedCustomFields =
        await prepareCustomFieldValues(
          companyId,
          customFields,
          {
            requireMissing: true,
          }
        );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          error?.message ||
          "Invalid custom field values",
      });
    }

    const lead =
      await prisma.lead.create({
        data: {
          companyId,

          name: cleanName,
          phone: cleanPhone,

          email: email
            ? String(email)
                .trim()
                .toLowerCase()
            : null,

          course: course
            ? String(course).trim()
            : null,

          source: sourceKey,
          stage: stageKey,

          campaign: campaign
            ? String(campaign).trim()
            : null,

          medium: medium
            ? String(medium).trim()
            : null,

          assignedToName:
            assignedToName
              ? String(
                  assignedToName
                ).trim()
              : null,

          notes: notes
            ? String(notes).trim()
            : null,

          utmLinkId:
            validUtmLinkId,
        },
      });

    await saveCustomFieldValues(
      lead.id,
      preparedCustomFields
    );

    const createdLead =
      await prisma.lead.findUnique({
        where: {
          id: lead.id,
        },
        include: {
          customFieldValues: {
            include: {
              customField: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      lead: formatLead(
        createdLead,
        new Map([
          [
            sourceConfig.key,
            sourceConfig.name,
          ],
        ])
      ),
    });
  } catch (error) {
    console.error(
      "Failed to create lead:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create lead",
    });
  }
});

/* =========================================================
   UPDATE LEAD
========================================================= */

router.patch("/:id", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const lead =
      await prisma.lead.findFirst({
        where: {
          id: req.params.id,
          companyId,
        },
      });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      const name = String(
        req.body.name || ""
      ).trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message:
            "Lead name cannot be empty",
        });
      }

      data.name = name;
    }

    if (req.body.phone !== undefined) {
      const phone = String(
        req.body.phone || ""
      ).trim();

      if (!phone) {
        return res.status(400).json({
          success: false,
          message:
            "Phone number cannot be empty",
        });
      }

      data.phone = phone;
    }

    if (req.body.email !== undefined) {
      data.email = req.body.email
        ? String(req.body.email)
            .trim()
            .toLowerCase()
        : null;
    }

    if (req.body.course !== undefined) {
      data.course = req.body.course
        ? String(req.body.course).trim()
        : null;
    }

    if (req.body.campaign !== undefined) {
      data.campaign =
        req.body.campaign
          ? String(
              req.body.campaign
            ).trim()
          : null;
    }

    if (req.body.medium !== undefined) {
      data.medium = req.body.medium
        ? String(req.body.medium).trim()
        : null;
    }

    if (
      req.body.assignedToName !==
      undefined
    ) {
      data.assignedToName =
        req.body.assignedToName
          ? String(
              req.body.assignedToName
            ).trim()
          : null;
    }

    if (req.body.notes !== undefined) {
      data.notes = req.body.notes
        ? String(req.body.notes).trim()
        : null;
    }

    if (req.body.source !== undefined) {
      const source =
        String(req.body.source)
          .trim()
          .toUpperCase();

      const sourceConfig =
        await validateSource(
          companyId,
          source
        );

      if (!sourceConfig) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or inactive lead source",
        });
      }

      data.source = source;
    }

    if (req.body.stage !== undefined) {
      const stage =
        String(req.body.stage)
          .trim()
          .toUpperCase();

      if (
        !VALID_STAGES.includes(stage)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid lead stage",
        });
      }

      data.stage = stage;
    }

    let preparedCustomFields = [];

    if (req.body.customFields !== undefined) {
      try {
        preparedCustomFields =
          await prepareCustomFieldValues(
            companyId,
            req.body.customFields
          );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message:
            error?.message ||
            "Invalid custom field values",
        });
      }
    }

    const updated =
      await prisma.lead.update({
        where: {
          id: lead.id,
        },

        data,
      });

    if (req.body.customFields !== undefined) {
      await saveCustomFieldValues(
        updated.id,
        preparedCustomFields
      );
    }

    const updatedWithCustomFields =
      await prisma.lead.findUnique({
        where: {
          id: updated.id,
        },
        include: {
          customFieldValues: {
            include: {
              customField: true,
            },
          },
        },
      });

    const sourceMap =
      await getSourceMap(
        companyId
      );

    return res.json({
      success: true,
      message:
        "Lead updated successfully",
      lead:
        formatLead(
          updatedWithCustomFields,
          sourceMap
        ),
    });
  } catch (error) {
    console.error(
      "Failed to update lead:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update lead",
    });
  }
});

/* =========================================================
   GET ACTIVE LEAD SOURCES FOR FORMS
========================================================= */

router.get(
  "/meta/sources",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const sources =
        await prisma.leadSourceConfig.findMany({
          where: {
            companyId,
            active: true,
            showInForms: true,
          },
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              name: "asc",
            },
          ],
          select: {
            id: true,
            key: true,
            name: true,
          },
        });

      return res.json({
        success: true,
        sources,
      });
    } catch (error) {
      console.error(
        "Failed to load active lead sources:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load lead sources",
      });
    }
  }
);


/* =========================================================
   GET ACTIVE CUSTOM FIELDS FOR LEAD FORMS
========================================================= */

router.get(
  "/meta/custom-fields",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const fields =
        await prisma.customField.findMany({
          where: {
            companyId,
            entityType: "LEAD",
            active: true,
            showInForms: true,
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
        fields: fields.map((field) => ({
          id: field.id,
          key: field.key,
          name: field.name,
          description: field.description,
          fieldType: field.fieldType,
          required: field.required,
          options: Array.isArray(field.options)
            ? field.options
            : [],
          sortOrder: field.sortOrder,
        })),
      });
    } catch (error) {
      console.error(
        "Failed to load lead custom fields:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load custom fields",
      });
    }
  }
);

/* =========================================================
   GET UTM LINKS
========================================================= */

router.get("/utm/links", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const links =
      await prisma.utmLink.findMany({
        where: {
          companyId,
        },

        include: {
          _count: {
            select: {
              leads: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      success: true,
      links: links.map(formatLink),
    });
  } catch (error) {
    console.error(
      "Failed to fetch UTM links:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch UTM links",
    });
  }
});

/* =========================================================
   CREATE UTM LINK
========================================================= */

router.post("/utm/links", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const {
      campaign,
      source,
      medium,
      url,
    } = req.body || {};

    const cleanCampaign =
      String(campaign || "").trim();

    const cleanSource =
      String(source || "").trim();

    const cleanMedium =
      String(medium || "").trim();

    const cleanUrl =
      String(url || "").trim();

    if (
      !cleanCampaign ||
      !cleanSource ||
      !cleanMedium ||
      !cleanUrl
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Campaign, source, medium and URL are required",
      });
    }

    const link =
      await prisma.utmLink.create({
        data: {
          companyId,
          campaign: cleanCampaign,
          source: cleanSource,
          medium: cleanMedium,
          url: cleanUrl,
        },

        include: {
          _count: {
            select: {
              leads: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "UTM link created successfully",
      link: formatLink(link),
    });
  } catch (error) {
    console.error(
      "Failed to create UTM link:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create UTM link",
    });
  }
});

export default router;