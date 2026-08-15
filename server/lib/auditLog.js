import prisma from "./prisma.js";

function clientIp(req) {
  const forwarded =
    req.headers?.["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return (
      forwarded
        .split(",")[0]
        ?.trim() ||
      null
    );
  }

  return (
    req.ip ||
    req.socket?.remoteAddress ||
    null
  );
}

export async function writeAuditLog({
  req,
  companyId,
  actor,
  action,
  entityType,
  entityId = null,
  summary,
  metadata = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId,

        actorUserId:
          actor?.id ||
          req?.clientUser?.userId ||
          null,

        actorName:
          actor?.name ||
          null,

        actorEmail:
          actor?.email ||
          null,

        actorRole:
          actor?.role ||
          req?.clientUser?.role ||
          null,

        action:
          String(action),

        entityType:
          String(entityType),

        entityId:
          entityId
            ? String(entityId)
            : null,

        summary:
          String(summary),

        metadata:
          metadata &&
          typeof metadata === "object"
            ? metadata
            : null,

        ipAddress:
          req
            ? clientIp(req)
            : null,

        userAgent:
          req?.headers?.[
            "user-agent"
          ]
            ? String(
                req.headers[
                  "user-agent"
                ]
              ).slice(0, 500)
            : null,
      },
    });
  } catch (error) {
    // Audit logging must never break the user's main action.
    console.error(
      "Audit log write failed:",
      error
    );
  }
}