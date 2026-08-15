import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

const TYPE_LABELS = {
  EXTERNAL_DATA: "External Data",
  OFFLINE_LEADGEN: "Offline LeadGen",
  PURCHASED: "Purchased",
  UPLOADED: "Uploaded",
  ASSIGNED: "Assigned",
};

const VALID_TYPES = Object.keys(TYPE_LABELS);

function formatDataset(dataset) {
  return {
    id: dataset.id,
    name: dataset.name,
    type: dataset.type,
    typeLabel:
      TYPE_LABELS[dataset.type] ||
      dataset.type,
    sourceName: dataset.sourceName,
    count: dataset.leadCount,
    assignedTo:
      dataset.assignedTo ||
      "Unassigned",
    converted:
      dataset.convertedCount,
    notes: dataset.notes,
    uploadedAt:
      dataset.uploadedAt,
    createdAt:
      dataset.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const type =
      String(req.query.type || "")
        .trim()
        .toUpperCase();

    const where = {
      companyId,
    };

    if (
      type &&
      VALID_TYPES.includes(type)
    ) {
      where.type = type;
    }

    const datasets =
      await prisma.leadDataset.findMany({
        where,

        orderBy: {
          uploadedAt: "desc",
        },
      });

    return res.json({
      success: true,
      datasets:
        datasets.map(
          formatDataset
        ),
    });
  } catch (error) {
    console.error(
      "Failed to fetch lead datasets:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch lead datasets",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const {
      name,
      type,
      sourceName,
      leadCount,
      assignedTo,
      convertedCount,
      notes,
      uploadedAt,
    } = req.body || {};

    const cleanName =
      String(name || "").trim();

    const typeKey =
      String(type || "")
        .trim()
        .toUpperCase();

    const parsedLeadCount =
      Number(leadCount || 0);

    const parsedConvertedCount =
      Number(
        convertedCount || 0
      );

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message:
          "Dataset name is required",
      });
    }

    if (
      !VALID_TYPES.includes(
        typeKey
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid dataset type",
      });
    }

    if (
      !Number.isInteger(
        parsedLeadCount
      ) ||
      parsedLeadCount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Lead count must be a valid whole number",
      });
    }

    if (
      !Number.isInteger(
        parsedConvertedCount
      ) ||
      parsedConvertedCount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Converted count must be a valid whole number",
      });
    }

    if (
      parsedConvertedCount >
      parsedLeadCount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Converted count cannot exceed lead count",
      });
    }

    let parsedUploadedAt =
      new Date();

    if (uploadedAt) {
      parsedUploadedAt =
        new Date(uploadedAt);

      if (
        Number.isNaN(
          parsedUploadedAt.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid upload date",
        });
      }
    }

    const dataset =
      await prisma.leadDataset.create({
        data: {
          companyId,
          name: cleanName,
          type: typeKey,
          sourceName:
            sourceName
              ? String(
                  sourceName
                ).trim()
              : null,
          leadCount:
            parsedLeadCount,
          assignedTo:
            assignedTo
              ? String(
                  assignedTo
                ).trim()
              : null,
          convertedCount:
            parsedConvertedCount,
          notes:
            notes
              ? String(
                  notes
                ).trim()
              : null,
          uploadedAt:
            parsedUploadedAt,
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Dataset created successfully",
      dataset:
        formatDataset(dataset),
    });
  } catch (error) {
    console.error(
      "Failed to create lead dataset:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create lead dataset",
    });
  }
});

router.patch(
  "/:id",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const existing =
        await prisma.leadDataset.findFirst({
          where: {
            id: req.params.id,
            companyId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Dataset not found",
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
              "Dataset name cannot be empty",
          });
        }

        data.name = name;
      }

      if (
        req.body.assignedTo !==
        undefined
      ) {
        data.assignedTo =
          req.body.assignedTo
            ? String(
                req.body.assignedTo
              ).trim()
            : null;
      }

      if (
        req.body.convertedCount !==
        undefined
      ) {
        const convertedCount =
          Number(
            req.body.convertedCount
          );

        if (
          !Number.isInteger(
            convertedCount
          ) ||
          convertedCount < 0 ||
          convertedCount >
            existing.leadCount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid converted count",
          });
        }

        data.convertedCount =
          convertedCount;
      }

      if (
        req.body.notes !==
        undefined
      ) {
        data.notes =
          req.body.notes
            ? String(
                req.body.notes
              ).trim()
            : null;
      }

      const updated =
        await prisma.leadDataset.update({
          where: {
            id: existing.id,
          },

          data,
        });

      return res.json({
        success: true,
        message:
          "Dataset updated",
        dataset:
          formatDataset(updated),
      });
    } catch (error) {
      console.error(
        "Failed to update dataset:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update dataset",
      });
    }
  }
);

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const existing =
        await prisma.leadDataset.findFirst({
          where: {
            id: req.params.id,
            companyId,
          },
        });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message:
            "Dataset not found",
        });
      }

      await prisma.leadDataset.delete({
        where: {
          id: existing.id,
        },
      });

      return res.json({
        success: true,
        message:
          "Dataset deleted",
      });
    } catch (error) {
      console.error(
        "Failed to delete dataset:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete dataset",
      });
    }
  }
);

export default router;