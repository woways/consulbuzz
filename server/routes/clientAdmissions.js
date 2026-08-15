import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

const VALID_STATUSES = [
  "PENDING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatAdmission(admission) {
  const totalFee =
    Number(admission.totalFee) || 0;

  const paidAmount =
    Number(admission.paidAmount) || 0;

  return {
    id: admission.id,

    leadId: admission.leadId,

    name: admission.studentName,

    phone: admission.studentPhone,

    email: admission.studentEmail,

    college: admission.college,

    course: admission.course,

    counsellor:
      admission.counsellorName ||
      "Unassigned",

    total: totalFee,

    paid: paidAmount,

    pending: Math.max(
      totalFee - paidAmount,
      0
    ),

    status:
      STATUS_LABELS[
        admission.status
      ] || admission.status,

    statusKey: admission.status,

    admissionDate:
      admission.admissionDate,

    notes: admission.notes,

    createdAt: admission.createdAt,

    lead: admission.lead
      ? {
          id: admission.lead.id,
          source:
            admission.lead.source,
          campaign:
            admission.lead.campaign,
        }
      : null,
  };
}

/* =========================================================
   GET ADMISSIONS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const admissions =
      await prisma.admission.findMany({
        where: {
          companyId,
        },

        include: {
          lead: {
            select: {
              id: true,
              source: true,
              campaign: true,
            },
          },
        },

        orderBy: {
          admissionDate: "desc",
        },
      });

    const formatted =
      admissions.map(
        formatAdmission
      );

    const now = new Date();

    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const thisMonth =
      admissions.filter(
        (admission) =>
          new Date(
            admission.admissionDate
          ) >= monthStart
      ).length;

    const totalFees =
      formatted.reduce(
        (sum, admission) =>
          sum + admission.total,
        0
      );

    const received =
      formatted.reduce(
        (sum, admission) =>
          sum + admission.paid,
        0
      );

    const pending =
      formatted.reduce(
        (sum, admission) =>
          sum + admission.pending,
        0
      );

    return res.json({
      success: true,

      admissions: formatted,

      summary: {
        totalAdmissions:
          formatted.length,

        thisMonth,

        totalFees,

        received,

        pending,
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch admissions:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch admissions",
    });
  }
});

/* =========================================================
   GET LEADS AVAILABLE FOR ADMISSION
========================================================= */

router.get(
  "/eligible-leads",
  async (req, res) => {
    try {
      const companyId =
        req.clientUser.companyId;

      const leads =
        await prisma.lead.findMany({
          where: {
            companyId,

           admission: {
  is: null,
},

            stage: {
              not: "LOST",
            },
          },

          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            course: true,
            assignedToName: true,
            source: true,
            campaign: true,
            stage: true,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      return res.json({
        success: true,
        leads,
      });
    } catch (error) {
      console.error(
        "Failed to fetch eligible leads:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to fetch eligible leads",
      });
    }
  }
);

/* =========================================================
   CREATE ADMISSION
========================================================= */

router.post("/", async (req, res) => {
  try {
    const companyId =
      req.clientUser.companyId;

    const {
      leadId,
      studentName,
      studentPhone,
      studentEmail,
      college,
      course,
      counsellorName,
      totalFee,
      paidAmount,
      status,
      admissionDate,
      notes,
    } = req.body || {};

    let cleanStudentName =
      String(
        studentName || ""
      ).trim();

    let cleanStudentPhone =
      studentPhone
        ? String(
            studentPhone
          ).trim()
        : null;

    let cleanStudentEmail =
      studentEmail
        ? String(
            studentEmail
          )
            .trim()
            .toLowerCase()
        : null;

    let cleanCourse =
      String(course || "").trim();

    let cleanCounsellor =
      counsellorName
        ? String(
            counsellorName
          ).trim()
        : null;

    const cleanCollege =
      String(college || "").trim();

    const statusKey =
      String(
        status || "ONGOING"
      )
        .trim()
        .toUpperCase();

    const parsedTotalFee =
      Number(totalFee || 0);

    const parsedPaidAmount =
      Number(paidAmount || 0);

    if (!cleanCollege) {
      return res.status(400).json({
        success: false,
        message:
          "College is required",
      });
    }

    if (
      !Number.isFinite(
        parsedTotalFee
      ) ||
      parsedTotalFee < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Total fee must be a valid amount",
      });
    }

    if (
      !Number.isFinite(
        parsedPaidAmount
      ) ||
      parsedPaidAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Paid amount must be a valid amount",
      });
    }

    if (
      parsedPaidAmount >
      parsedTotalFee
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Paid amount cannot exceed total fee",
      });
    }

    if (
      !VALID_STATUSES.includes(
        statusKey
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid admission status",
      });
    }

    let selectedLead = null;

    if (leadId) {
      selectedLead =
        await prisma.lead.findFirst({
          where: {
            id: String(leadId),
            companyId,
          },

          include: {
            admission: true,
          },
        });

      if (!selectedLead) {
        return res.status(404).json({
          success: false,
          message:
            "Lead not found for this company",
        });
      }

      if (
        selectedLead.admission
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This lead already has an admission",
        });
      }

      cleanStudentName =
        cleanStudentName ||
        selectedLead.name;

      cleanStudentPhone =
        cleanStudentPhone ||
        selectedLead.phone;

      cleanStudentEmail =
        cleanStudentEmail ||
        selectedLead.email;

      cleanCourse =
        cleanCourse ||
        selectedLead.course ||
        "";

      cleanCounsellor =
        cleanCounsellor ||
        selectedLead.assignedToName;
    }

    if (!cleanStudentName) {
      return res.status(400).json({
        success: false,
        message:
          "Student name is required",
      });
    }

    if (!cleanCourse) {
      return res.status(400).json({
        success: false,
        message:
          "Course is required",
      });
    }

    let parsedAdmissionDate =
      new Date();

    if (admissionDate) {
      parsedAdmissionDate =
        new Date(admissionDate);

      if (
        Number.isNaN(
          parsedAdmissionDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid admission date",
        });
      }
    }

    const admission =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.admission.create({
              data: {
                companyId,

                leadId:
                  selectedLead?.id ||
                  null,

                studentName:
                  cleanStudentName,

                studentPhone:
                  cleanStudentPhone,

                studentEmail:
                  cleanStudentEmail,

                college:
                  cleanCollege,

                course:
                  cleanCourse,

                counsellorName:
                  cleanCounsellor,

                totalFee:
                  parsedTotalFee,

                paidAmount:
                  parsedPaidAmount,

                status:
                  statusKey,

                admissionDate:
                  parsedAdmissionDate,

                notes: notes
                  ? String(
                      notes
                    ).trim()
                  : null,
              },

              include: {
                lead: {
                  select: {
                    id: true,
                    source: true,
                    campaign: true,
                  },
                },
              },
            });

          if (selectedLead) {
            await tx.lead.update({
              where: {
                id:
                  selectedLead.id,
              },

              data: {
                stage: "ADMITTED",
              },
            });
          }

          return created;
        }
      );

    return res.status(201).json({
      success: true,

      message:
        "Admission created successfully",

      admission:
        formatAdmission(
          admission
        ),
    });
  } catch (error) {
    console.error(
      "Failed to create admission:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create admission",
    });
  }
});

export default router;