import { Router } from "express";
import bcrypt from "bcryptjs";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";
import { writeAuditLog } from "../lib/auditLog.js";

const router = Router();

router.use(requireClientUser);

const ALLOWED_ROLES = [
  "CLIENT_ADMIN",
  "MANAGER",
  "EMPLOYEE",
];

const PERMISSION_KEYS = [
  "canManageUsers",
  "canManageSettings",
  "canManageBilling",
  "canViewAnalytics",
  "canManageAdmissions",
  "canManageRevenue",
  "canManageLeads",
  "canManageSupport",
];

function defaultPermissions(role) {
  if (role === "CLIENT_ADMIN") {
    return {
      canManageUsers: true,
      canManageSettings: true,
      canManageBilling: true,
      canViewAnalytics: true,
      canManageAdmissions: true,
      canManageRevenue: true,
      canManageLeads: true,
      canManageSupport: true,
    };
  }

  if (role === "MANAGER") {
    return {
      canManageUsers: false,
      canManageSettings: false,
      canManageBilling: false,
      canViewAnalytics: true,
      canManageAdmissions: true,
      canManageRevenue: true,
      canManageLeads: true,
      canManageSupport: true,
    };
  }

  return {
    canManageUsers: false,
    canManageSettings: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canManageAdmissions: false,
    canManageRevenue: false,
    canManageLeads: true,
    canManageSupport: true,
  };
}

function formatUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    phone: user.phone,
    jobTitle: user.jobTitle,
    department: user.department,
    permissions: {
      canManageUsers:
        user.role === "CLIENT_ADMIN" ||
        user.canManageUsers,
      canManageSettings:
        user.role === "CLIENT_ADMIN" ||
        user.canManageSettings,
      canManageBilling:
        user.role === "CLIENT_ADMIN" ||
        user.canManageBilling,
      canViewAnalytics:
        user.role === "CLIENT_ADMIN" ||
        user.canViewAnalytics,
      canManageAdmissions:
        user.role === "CLIENT_ADMIN" ||
        user.canManageAdmissions,
      canManageRevenue:
        user.role === "CLIENT_ADMIN" ||
        user.canManageRevenue,
      canManageLeads:
        user.role === "CLIENT_ADMIN" ||
        user.canManageLeads,
      canManageSupport:
        user.role === "CLIENT_ADMIN" ||
        user.canManageSupport,
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getActor(req) {
  return prisma.user.findUnique({
    where: {
      id: req.clientUser.userId,
    },
  });
}

async function requireUserManager(req, res) {
  const actor = await getActor(req);

  if (
    !actor ||
    !actor.active ||
    actor.companyId !==
      req.clientUser.companyId
  ) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return null;
  }

  if (
    actor.role !== "CLIENT_ADMIN" &&
    !actor.canManageUsers
  ) {
    res.status(403).json({
      success: false,
      message:
        "You do not have permission to manage users",
    });
    return null;
  }

  return actor;
}

function buildPermissionData(
  role,
  source = {}
) {
  if (role === "CLIENT_ADMIN") {
    return defaultPermissions(role);
  }

  const defaults =
    defaultPermissions(role);

  const result = {};

  for (const key of PERMISSION_KEYS) {
    result[key] =
      typeof source[key] ===
      "boolean"
        ? source[key]
        : defaults[key];
  }

  return result;
}

router.get("/", async (req, res) => {
  try {
    const actor =
      await requireUserManager(
        req,
        res
      );

    if (!actor) return;

    const users =
      await prisma.user.findMany({
        where: {
          companyId:
            req.clientUser.companyId,
          role: {
            not: "SUPER_ADMIN",
          },
        },
        orderBy: [
          { active: "desc" },
          { createdAt: "asc" },
        ],
      });

    return res.json({
      success: true,
      users:
        users.map(formatUser),
    });
  } catch (error) {
    console.error(
      "Load client users failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load users",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const actor =
      await requireUserManager(
        req,
        res
      );

    if (!actor) return;

    const name = String(
      req.body?.name || ""
    ).trim();

    const email = String(
      req.body?.email || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      req.body?.password || ""
    );

    const role = String(
      req.body?.role ||
        "EMPLOYEE"
    )
      .trim()
      .toUpperCase();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user role",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase and a number",
      });
    }

    const duplicate =
      await prisma.user.findUnique({
        where: { email },
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    const permissions =
      buildPermissionData(
        role,
        req.body?.permissions || {}
      );

    const user =
      await prisma.user.create({
        data: {
          companyId:
            req.clientUser.companyId,
          name,
          email,
          passwordHash,
          role,
          active: true,
          phone:
            req.body?.phone
              ? String(req.body.phone).trim()
              : null,
          jobTitle:
            req.body?.jobTitle
              ? String(req.body.jobTitle).trim()
              : null,
          department:
            req.body?.department
              ? String(req.body.department).trim()
              : null,
          ...permissions,
        },
      });

    await prisma.notification.create({
      data: {
        companyId:
          req.clientUser.companyId,
        userId: actor.id,
        title: "User added",
        message:
          `${user.name} was added as ${user.role.replaceAll("_", " ")}.`,
        type: "USER",
        actionModule: "settings",
        actionLabel:
          "Open Users & Roles",
      },
    });

    await writeAuditLog({
      req,
      companyId:
        req.clientUser.companyId,
      actor,
      action:
        "USER_CREATED",
      entityType:
        "USER",
      entityId:
        user.id,
      summary:
        `${actor.name} added ${user.name} as ${user.role.replaceAll("_", " ")}.`,
      metadata: {
        targetEmail:
          user.email,
        role:
          user.role,
        department:
          user.department,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",
      user:
        formatUser(user),
    });
  } catch (error) {
    console.error(
      "Create client user failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create user",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const actor =
      await requireUserManager(
        req,
        res
      );

    if (!actor) return;

    const target =
      await prisma.user.findFirst({
        where: {
          id: req.params.id,
          companyId:
            req.clientUser.companyId,
          role: {
            not: "SUPER_ADMIN",
          },
        },
      });

    if (!target) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
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
            "User name is required",
        });
      }
      data.name = name;
    }

    if (req.body.email !== undefined) {
      const email = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required",
        });
      }

      const duplicate =
        await prisma.user.findFirst({
          where: {
            email,
            id: {
              not: target.id,
            },
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists",
        });
      }

      data.email = email;
    }

    let role =
      target.role;

    if (req.body.role !== undefined) {
      role = String(
        req.body.role || ""
      )
        .trim()
        .toUpperCase();

      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user role",
        });
      }

      if (
        target.id === actor.id &&
        target.role === "CLIENT_ADMIN" &&
        role !== "CLIENT_ADMIN"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove your own Client Admin role",
        });
      }

      data.role = role;
    }

    if (req.body.active !== undefined) {
      const active =
        req.body.active === true;

      if (
        target.id === actor.id &&
        !active
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot deactivate your own account",
        });
      }

      data.active = active;
    }

    for (const field of [
      "phone",
      "jobTitle",
      "department",
    ]) {
      if (req.body[field] !== undefined) {
        data[field] =
          req.body[field]
            ? String(req.body[field]).trim()
            : null;
      }
    }

    if (
      req.body.permissions !== undefined ||
      req.body.role !== undefined
    ) {
      Object.assign(
        data,
        buildPermissionData(
          role,
          req.body.permissions || {}
        )
      );
    }

    const updated =
      await prisma.user.update({
        where: {
          id: target.id,
        },
        data,
      });

    const changedFields =
      Object.keys(data);

    await writeAuditLog({
      req,
      companyId:
        req.clientUser.companyId,
      actor,
      action:
        data.active !== undefined &&
        changedFields.length === 1
          ? data.active
            ? "USER_ACTIVATED"
            : "USER_DEACTIVATED"
          : "USER_UPDATED",
      entityType:
        "USER",
      entityId:
        updated.id,
      summary:
        `${actor.name} updated ${updated.name}.`,
      metadata: {
        changedFields,
        targetEmail:
          updated.email,
        role:
          updated.role,
        active:
          updated.active,
      },
    });

    return res.json({
      success: true,
      message:
        "User updated successfully",
      user:
        formatUser(updated),
    });
  } catch (error) {
    console.error(
      "Update client user failed:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update user",
    });
  }
});

router.patch(
  "/:id/reset-password",
  async (req, res) => {
    try {
      const actor =
        await requireUserManager(
          req,
          res
        );

      if (!actor) return;

      const target =
        await prisma.user.findFirst({
          where: {
            id: req.params.id,
            companyId:
              req.clientUser.companyId,
            role: {
              not: "SUPER_ADMIN",
            },
          },
        });

      if (!target) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      const password = String(
        req.body?.password || ""
      );

      if (
        password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters and include uppercase, lowercase and a number",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      await prisma.user.update({
        where: {
          id: target.id,
        },
        data: {
          passwordHash,
        },
      });

      await writeAuditLog({
        req,
        companyId:
          req.clientUser.companyId,
        actor,
        action:
          "USER_PASSWORD_RESET",
        entityType:
          "USER",
        entityId:
          target.id,
        summary:
          `${actor.name} reset the password for ${target.name}.`,
        metadata: {
          targetEmail:
            target.email,
        },
      });

      return res.json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.error(
        "Reset client user password failed:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset password",
      });
    }
  }
);

export default router;