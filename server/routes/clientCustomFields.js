import { Router } from "express";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
  requireClientPermission,
} from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

const VALID_ENTITY_TYPES = ["LEAD"];

const VALID_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DROPDOWN",
  "DATE",
  "CHECKBOX",
  "EMAIL",
  "PHONE",
];

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeOptions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    ),
  ];
}

function formatField(field) {
  return {
    id: field.id,
    entityType: field.entityType,
    fieldType: field.fieldType,
    name: field.name,
    key: field.key,
    description: field.description,
    required: field.required,
    showInForms: field.showInForms,
    active: field.active,
    sortOrder: field.sortOrder,
    options: Array.isArray(field.options) ? field.options : [],
    createdAt: field.createdAt,
    updatedAt: field.updatedAt,
  };
}

async function findCompanyField(companyId, id) {
  return prisma.customField.findFirst({
    where: {
      id,
      companyId,
    },
  });
}


function requireSettingsManager(req, res, next) {
  return requireClientPermission(
    "canManageSettings",
    "You do not have permission to manage custom fields"
  )(req, res, next);
}

/* =========================================================
   GET CUSTOM FIELDS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const entityType = String(
      req.query.entityType || "LEAD"
    )
      .trim()
      .toUpperCase();

    const formsOnly =
      String(req.query.formsOnly || "").toLowerCase() === "true";

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid custom field entity type",
      });
    }

    const fields = await prisma.customField.findMany({
      where: {
        companyId,
        entityType,
        ...(formsOnly
          ? {
              active: true,
              showInForms: true,
            }
          : {}),
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
      fields: fields.map(formatField),
    });
  } catch (error) {
    console.error("Failed to fetch custom fields:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch custom fields",
    });
  }
});

/* =========================================================
   CREATE CUSTOM FIELD
========================================================= */

router.post("/", requireSettingsManager, async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const name = String(req.body?.name || "").trim();
    const key = normalizeKey(req.body?.key || name);

    const entityType = String(
      req.body?.entityType || "LEAD"
    )
      .trim()
      .toUpperCase();

    const fieldType = String(
      req.body?.fieldType || "TEXT"
    )
      .trim()
      .toUpperCase();

    const options = normalizeOptions(req.body?.options);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Field name is required",
      });
    }

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Field key is required",
      });
    }

    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity type",
      });
    }

    if (!VALID_FIELD_TYPES.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field type",
      });
    }

    if (fieldType === "DROPDOWN" && options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Add at least one dropdown option",
      });
    }

    const existing = await prisma.customField.findUnique({
      where: {
        companyId_entityType_key: {
          companyId,
          entityType,
          key,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A custom field with this key already exists",
      });
    }

    const field = await prisma.customField.create({
      data: {
        companyId,
        entityType,
        fieldType,
        name,
        key,
        description: req.body?.description
          ? String(req.body.description).trim()
          : null,
        required: req.body?.required === true,
        showInForms: req.body?.showInForms !== false,
        active: req.body?.active !== false,
        sortOrder: Number.isFinite(Number(req.body?.sortOrder))
          ? Number(req.body.sortOrder)
          : 0,
        options: fieldType === "DROPDOWN" ? options : [],
      },
    });

    return res.status(201).json({
      success: true,
      message: "Custom field created successfully",
      field: formatField(field),
    });
  } catch (error) {
    console.error("Failed to create custom field:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create custom field",
    });
  }
});

/* =========================================================
   UPDATE CUSTOM FIELD
========================================================= */

router.patch("/:id", requireSettingsManager, async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const existing = await findCompanyField(
      companyId,
      req.params.id
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Custom field not found",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Field name cannot be empty",
        });
      }

      data.name = name;
    }

    if (req.body.key !== undefined) {
      const key = normalizeKey(req.body.key);

      if (!key) {
        return res.status(400).json({
          success: false,
          message: "Field key cannot be empty",
        });
      }

      const duplicate = await prisma.customField.findFirst({
        where: {
          companyId,
          entityType: existing.entityType,
          key,
          id: {
            not: existing.id,
          },
        },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A custom field with this key already exists",
        });
      }

      data.key = key;
    }

    if (req.body.fieldType !== undefined) {
      const fieldType = String(req.body.fieldType || "")
        .trim()
        .toUpperCase();

      if (!VALID_FIELD_TYPES.includes(fieldType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid field type",
        });
      }

      data.fieldType = fieldType;
    }

    const finalFieldType =
      data.fieldType || existing.fieldType;

    if (req.body.options !== undefined) {
      const options = normalizeOptions(req.body.options);

      if (finalFieldType === "DROPDOWN" && options.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Add at least one dropdown option",
        });
      }

      data.options =
        finalFieldType === "DROPDOWN" ? options : [];
    } else if (
      data.fieldType &&
      data.fieldType !== "DROPDOWN"
    ) {
      data.options = [];
    }

    if (req.body.description !== undefined) {
      data.description = req.body.description
        ? String(req.body.description).trim()
        : null;
    }

    if (typeof req.body.required === "boolean") {
      data.required = req.body.required;
    }

    if (typeof req.body.showInForms === "boolean") {
      data.showInForms = req.body.showInForms;
    }

    if (typeof req.body.active === "boolean") {
      data.active = req.body.active;
    }

    if (req.body.sortOrder !== undefined) {
      const sortOrder = Number(req.body.sortOrder);

      if (!Number.isFinite(sortOrder)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sort order",
        });
      }

      data.sortOrder = sortOrder;
    }

    const field = await prisma.customField.update({
      where: {
        id: existing.id,
      },
      data,
    });

    return res.json({
      success: true,
      message: "Custom field updated successfully",
      field: formatField(field),
    });
  } catch (error) {
    console.error("Failed to update custom field:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update custom field",
    });
  }
});

/* =========================================================
   DELETE CUSTOM FIELD
========================================================= */

router.delete("/:id", requireSettingsManager, async (req, res) => {
  try {
    const companyId = req.clientUser.companyId;

    const existing = await findCompanyField(
      companyId,
      req.params.id
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Custom field not found",
      });
    }

    await prisma.customField.delete({
      where: {
        id: existing.id,
      },
    });

    return res.json({
      success: true,
      message: "Custom field deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete custom field:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete custom field",
    });
  }
});

export default router;