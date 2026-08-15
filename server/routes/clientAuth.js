import {
  Router,
} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";
import {
  requireClientUser,
} from "../middleware/clientAuth.js";
import {
  createRateLimiter,
} from "../middleware/rateLimit.js";

const router =
  Router();

const COOKIE_NAME =
  "cb_client_token";

const loginLimiter =
  createRateLimiter({
    windowMs:
      15 * 60 * 1000,
    max: 15,
    keyPrefix:
      "client-login",
    message:
      "Too many sign-in attempts. Please try again later.",
  });

const passwordLimiter =
  createRateLimiter({
    windowMs:
      15 * 60 * 1000,
    max: 8,
    keyPrefix:
      "client-password",
    message:
      "Too many password attempts. Please try again later.",
  });

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

function cookieOptions() {
  const production =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly:
      true,
    secure:
      production,
    sameSite:
      production
        ? "none"
        : "lax",
    maxAge:
      8 *
      60 *
      60 *
      1000,
    path:
      "/",
  };
}

function clearCookieOptions() {
  const {
    maxAge,
    ...rest
  } =
    cookieOptions();

  return rest;
}

function getActiveSubscription(
  subscriptions = []
) {
  return (
    subscriptions.find(
      (
        subscription
      ) =>
        subscription.status ===
          "ACTIVE" ||
        subscription.status ===
          "TRIAL"
    ) ||
    subscriptions[0] ||
    null
  );
}

function buildClientSession(user) {
  const company =
    user.company;

  const activeSubscription =
    getActiveSubscription(
      company
        ?.subscriptions ||
        []
    );

  const modules =
    (
      company
        ?.companyModules ||
      []
    )
      .slice()
      .sort(
        (a, b) =>
          a.module
            .sortOrder -
          b.module
            .sortOrder
      )
      .map(
        (
          companyModule
        ) => ({
          id:
            companyModule
              .module.id,
          key:
            companyModule
              .module.key,
          name:
            companyModule
              .module.name,
          description:
            companyModule
              .module
              .description,
          icon:
            companyModule
              .module.icon,
          route:
            companyModule
              .module.route,
          enabled:
            companyModule
              .enabled,
        })
      );

  return {
    user: {
      id:
        user.id,
      name:
        user.name,
      email:
        user.email,
      role:
        user.role,
      phone:
        user.phone,
      jobTitle:
        user.jobTitle,
      department:
        user.department,

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
    },

    company: {
      id:
        company.id,
      slug:
        company.slug,
      name:
        company.name,

      brandName:
        company.settings
          ?.portalName ||
        company.brandName ||
        company.name,

      shortName:
        company.shortName ||
        company.name
          .split(" ")
          .filter(
            Boolean
          )
          .slice(
            0,
            2
          )
          .map(
            (word) =>
              word[0]
          )
          .join("")
          .toUpperCase(),

      business:
        company.business,
      ownerName:
        company.ownerName,
      city:
        company.city,
      email:
        company.email,
      phone:
        company.phone,

      logoUrl:
        company.settings
          ?.logoUrl ||
        company.logoUrl,

      primaryColor:
        company.settings
          ?.primaryColor ||
        company.primaryColor ||
        "indigo",

      secondaryColor:
        company.settings
          ?.secondaryColor ||
        null,

      subdomain:
        company.subdomain,
      status:
        company.status,

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

      modules,

      subscription:
        activeSubscription
          ? {
              id:
                activeSubscription.id,

              status:
                activeSubscription.status,

              billingCycle:
                activeSubscription.billingCycle,

              startDate:
                activeSubscription.startDate,

              renewalDate:
                activeSubscription.renewalDate,

              endDate:
                activeSubscription.endDate,

              amount:
                activeSubscription.amount
                  ? Number(
                      activeSubscription.amount
                    )
                  : 0,

              plan: {
                id:
                  activeSubscription.plan.id,

                key:
                  activeSubscription.plan.key,

                name:
                  activeSubscription.plan.name,

                tagline:
                  activeSubscription.plan.tagline,

                monthlyPrice:
                  Number(
                    activeSubscription.plan.monthlyPrice
                  ),

                yearlyPrice:
                  activeSubscription.plan.yearlyPrice
                    ? Number(
                        activeSubscription.plan.yearlyPrice
                      )
                    : null,
              },
            }
          : null,
    },
  };
}

async function getClientUser(
  userId
) {
  return prisma.user.findUnique({
    where: {
      id:
        userId,
    },

    include: {
      company: {
        include: {
          settings:
            true,

          subscriptions: {
            include: {
              plan:
                true,
            },

            orderBy: {
              createdAt:
                "desc",
            },
          },

          companyModules: {
            include: {
              module:
                true,
            },
          },
        },
      },
    },
  });
}

router.post(
  "/login",
  loginLimiter,
  async (
    req,
    res
  ) => {
    try {
      const email =
        String(
          req.body
            ?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          req.body
            ?.password ||
            ""
        );

      if (
        !email ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Email and password are required",
          });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },

          include: {
            company: {
              include: {
                settings:
                  true,

                subscriptions: {
                  include: {
                    plan:
                      true,
                  },

                  orderBy: {
                    createdAt:
                      "desc",
                  },
                },

                companyModules: {
                  include: {
                    module:
                      true,
                  },
                },
              },
            },
          },
        });

      if (
        !user ||
        !user.active ||
        user.role ===
          "SUPER_ADMIN" ||
        !user.company
      ) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Invalid email or password",
          });
      }

      if (
        [
          "SUSPENDED",
          "INACTIVE",
        ].includes(
          user.company
            .status
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,
            message:
              "Your company account is currently unavailable. Please contact ConsulBuzz support.",
          });
      }

      const passwordMatches =
        await bcrypt.compare(
          password,
          user.passwordHash
        );

      if (
        !passwordMatches
      ) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Invalid email or password",
          });
      }

      const token =
        jwt.sign(
          {
            sub:
              user.id,
            companyId:
              user.companyId,
            role:
              user.role,
          },
          getJwtSecret(),
          {
            expiresIn:
              "8h",
            algorithm:
              "HS256",
          }
        );

      res.cookie(
        COOKIE_NAME,
        token,
        cookieOptions()
      );

      return res.json({
        success:
          true,
        ...buildClientSession(
          user
        ),
      });
    } catch (error) {
      console.error(
        "Client login failed:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,
          message:
            "Unable to sign in",
        });
    }
  }
);

router.get(
  "/me",
  requireClientUser,
  async (
    req,
    res
  ) => {
    try {
      const user =
        await getClientUser(
          req.clientUser
            .userId
        );

      if (
        !user ||
        !user.active ||
        !user.company ||
        user.companyId !==
          req.clientUser
            .companyId ||
        user.role ===
          "SUPER_ADMIN"
      ) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Unauthorized",
          });
      }

      if (
        [
          "SUSPENDED",
          "INACTIVE",
        ].includes(
          user.company
            .status
        )
      ) {
        return res
          .status(403)
          .json({
            success:
              false,
            message:
              "Your company account is currently unavailable.",
          });
      }

      return res.json({
        success:
          true,
        ...buildClientSession(
          user
        ),
      });
    } catch (error) {
      console.error(
        "Client session check failed:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,
          message:
            "Unable to verify session",
        });
    }
  }
);

router.patch(
  "/change-password",
  requireClientUser,
  passwordLimiter,
  async (
    req,
    res
  ) => {
    try {
      const currentPassword =
        String(
          req.body
            ?.currentPassword ||
            ""
        );

      const newPassword =
        String(
          req.body
            ?.newPassword ||
            ""
        );

      const confirmPassword =
        String(
          req.body
            ?.confirmPassword ||
            ""
        );

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Current password, new password and confirmation are required",
          });
      }

      if (
        newPassword.length <
          8 ||
        !/[A-Z]/.test(
          newPassword
        ) ||
        !/[a-z]/.test(
          newPassword
        ) ||
        !/[0-9]/.test(
          newPassword
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "New password must be at least 8 characters and include uppercase, lowercase and a number",
          });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "New password and confirmation do not match",
          });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.clientUser.userId,
          },

          select: {
            id:
              true,
            companyId:
              true,
            role:
              true,
            active:
              true,
            passwordHash:
              true,
          },
        });

      if (
        !user ||
        !user.active ||
        !user.companyId ||
        user.companyId !==
          req.clientUser
            .companyId ||
        user.role ===
          "SUPER_ADMIN"
      ) {
        return res
          .status(401)
          .json({
            success:
              false,
            message:
              "Unauthorized",
          });
      }

      const currentMatches =
        await bcrypt.compare(
          currentPassword,
          user.passwordHash
        );

      if (
        !currentMatches
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "Current password is incorrect",
          });
      }

      const isSameAsOld =
        await bcrypt.compare(
          newPassword,
          user.passwordHash
        );

      if (
        isSameAsOld
      ) {
        return res
          .status(400)
          .json({
            success:
              false,
            message:
              "New password must be different from the current password",
          });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      await prisma.user.update({
        where: {
          id:
            user.id,
        },

        data: {
          passwordHash,
        },
      });

      res.clearCookie(
        COOKIE_NAME,
        clearCookieOptions()
      );

      return res.json({
        success:
          true,
        message:
          "Password changed successfully. Please sign in again.",
        signedOut:
          true,
      });
    } catch (error) {
      console.error(
        "Client password change failed:",
        error
      );

      return res
        .status(500)
        .json({
          success:
            false,
          message:
            "Unable to change password",
        });
    }
  }
);

router.post(
  "/logout",
  (
    req,
    res
  ) => {
    res.clearCookie(
      COOKIE_NAME,
      clearCookieOptions()
    );

    return res.json({
      success:
        true,
      message:
        "Signed out",
    });
  }
);

export default router;