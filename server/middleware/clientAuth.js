import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";

const COOKIE_NAME =
  "cb_client_token";

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured"
    );
  }

  return secret;
}

export async function requireClientUser(
  req,
  res,
  next
) {
  try {
    const token =
      req.cookies?.[
        COOKIE_NAME
      ];

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Unauthorized",
        });
    }

    const payload =
      jwt.verify(
        token,
        getJwtSecret(),
        {
          algorithms: [
            "HS256",
          ],
        }
      );

    if (
      !payload ||
      typeof payload !==
        "object" ||
      !payload.sub ||
      !payload.companyId ||
      payload.role ===
        "SUPER_ADMIN"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Unauthorized",
        });
    }

    const [
      user,
      systemSettings,
    ] =
      await Promise.all([
        prisma.user.findUnique({
          where: {
            id:
              payload.sub,
          },

          select: {
            id: true,
            companyId: true,
            role: true,
            active: true,

            company: {
              select: {
                status: true,
              },
            },

            canManageUsers: true,
            canManageSettings: true,
            canManageBilling: true,
            canViewAnalytics: true,
            canManageAdmissions: true,
            canManageRevenue: true,
            canManageLeads: true,
            canManageSupport: true,
          },
        }),

        prisma.systemSettings.upsert({
          where: {
            key: "global",
          },
          update: {},
          create: {
            key: "global",
          },
          select: {
            maintenanceMode: true,
          },
        }),
      ]);

    if (
      systemSettings
        .maintenanceMode
    ) {
      return res
        .status(503)
        .json({
          success: false,
          maintenance:
            true,
          message:
            "ConsulBuzz is temporarily under maintenance. Please try again shortly.",
        });
    }

    if (
      !user ||
      !user.active ||
      !user.companyId ||
      user.companyId !==
        payload.companyId ||
      user.role ===
        "SUPER_ADMIN" ||
      !user.company ||
      [
        "SUSPENDED",
        "INACTIVE",
      ].includes(
        user.company.status
      )
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Unauthorized",
        });
    }

    req.clientUser = {
      userId:
        user.id,
      companyId:
        user.companyId,
      role:
        user.role,

      permissions: {
        canManageUsers:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageUsers,

        canManageSettings:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageSettings,

        canManageBilling:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageBilling,

        canViewAnalytics:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canViewAnalytics,

        canManageAdmissions:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageAdmissions,

        canManageRevenue:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageRevenue,

        canManageLeads:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageLeads,

        canManageSupport:
          user.role ===
            "CLIENT_ADMIN" ||
          user.canManageSupport,
      },
    };

    return next();
  } catch (error) {
    console.error(
      "Client auth middleware failed:",
      error?.name ||
        "auth_error"
    );

    return res
      .status(401)
      .json({
        success: false,
        message:
          "Session expired or invalid",
      });
  }
}