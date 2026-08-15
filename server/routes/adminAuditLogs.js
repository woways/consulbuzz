import { Router } from "express";
import prisma from "../lib/prisma.js";
import { requireSuperAdmin } from "../middleware/adminAuth.js";

const router = Router();
router.use(requireSuperAdmin);

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 250);
    const search = String(req.query.search || "").trim();
    const entityType = String(req.query.entityType || "").trim().toUpperCase();
    const companyId = String(req.query.companyId || "").trim();
    const includeClient = String(req.query.includeClient || "") === "true";
    const where = {};
    if (entityType) where.entityType = entityType;
    if (companyId) where.companyId = companyId;
    if (search) where.OR = [
      { summary: { contains: search, mode: "insensitive" } },
      { actorName: { contains: search, mode: "insensitive" } },
      { actorEmail: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ];
    const adminLogs = await prisma.superAdminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: limit });
    let clientLogs = [];
    if (includeClient && companyId) {
      const clientWhere = { companyId };
      if (search) clientWhere.OR = [
        { summary: { contains: search, mode: "insensitive" } },
        { actorName: { contains: search, mode: "insensitive" } },
        { actorEmail: { contains: search, mode: "insensitive" } },
      ];
      clientLogs = await prisma.auditLog.findMany({ where: clientWhere, orderBy: { createdAt: "desc" }, take: limit });
    }
    const logs = [
      ...adminLogs.map((log) => ({ ...log, source: "SUPER_ADMIN", actorRole: "SUPER_ADMIN" })),
      ...clientLogs.map((log) => ({ ...log, source: "CLIENT", companyName: null })),
    ].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,limit);
    return res.json({ success: true, total: logs.length, logs });
  } catch (error) {
    console.error("Load Super Admin audit logs failed:", error);
    return res.status(500).json({ success: false, message: "Unable to load activity logs" });
  }
});

export default router;