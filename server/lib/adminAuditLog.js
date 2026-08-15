import prisma from "./prisma.js";

function getIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() || null;
  return req?.ip || req?.socket?.remoteAddress || null;
}

export async function writeSuperAdminAudit({ req, actor = null, action, entityType, entityId = null, companyId = null, companyName = null, summary, metadata = null }) {
  try {
    await prisma.superAdminAuditLog.create({
      data: {
        actorUserId: actor?.id || req?.admin?.userId || null,
        actorName: actor?.name || null,
        actorEmail: actor?.email || null,
        action: String(action),
        entityType: String(entityType),
        entityId: entityId ? String(entityId) : null,
        companyId: companyId ? String(companyId) : null,
        companyName: companyName ? String(companyName) : null,
        summary: String(summary),
        metadata: metadata && typeof metadata === "object" ? metadata : null,
        ipAddress: getIp(req),
        userAgent: req?.headers?.["user-agent"] ? String(req.headers["user-agent"]).slice(0, 500) : null,
      },
    });
  } catch (error) {
    console.error("Super Admin audit write failed:", error);
  }
}