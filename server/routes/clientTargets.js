import { Router } from "express";

import prisma from "../lib/prisma.js";
import { requireClientUser } from "../middleware/clientAuth.js";

const router = Router();

router.use(requireClientUser);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const VALID_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"];
const VALID_TYPES = ["CHECKLIST", "NUMERIC"];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeekMon(d) {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
function endOfMonth(d) {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Score for one task: only completed work counts (in-progress = 0).
function taskScore(task) {
  if (task.type === "NUMERIC") {
    const target = Number(task.targetValue || 0);
    if (target <= 0) return task.status === "DONE" ? 1 : 0;
    return Math.min(1, Number(task.currentValue || 0) / target);
  }
  // CHECKLIST
  return task.status === "DONE" ? 1 : 0;
}

// Average % (0-100) across a list of tasks.
function percentOf(tasks) {
  if (!tasks.length) return 0;
  const sum = tasks.reduce((acc, t) => acc + taskScore(t), 0);
  return Math.round((sum / tasks.length) * 100);
}

function formatTask(t) {
  return {
    id: t.id,
    title: t.title,
    source: t.source,
    assignedByUserId: t.assignedByUserId,
    ownerId: t.ownerId,
    date: t.date,
    type: t.type,
    targetValue: t.targetValue,
    currentValue: t.currentValue,
    status: t.status,
  };
}

// Can the current user see everyone's targets?
async function canViewTeam(req) {
  if (req.clientUser.role === "CLIENT_ADMIN") return true;
  const actor = await prisma.user.findUnique({
    where: { id: req.clientUser.userId },
    select: { canViewTeamTargets: true, active: true, companyId: true },
  });
  return Boolean(
    actor &&
      actor.active &&
      actor.companyId === req.clientUser.companyId &&
      actor.canViewTeamTargets
  );
}

// Build weekly + monthly analytics for a set of the owner's tasks in a month.
function buildAnalytics(tasks, monthStart) {
  const monthPct = percentOf(tasks);

  // Weekly buckets: weeks that overlap the month (Mon-based).
  const weeks = [];
  let cursor = startOfWeekMon(monthStart);
  const monthEnd = endOfMonth(monthStart);
  let wIndex = 1;
  while (cursor < monthEnd) {
    const wStart = cursor;
    const wEnd = addDays(cursor, 7);
    const wTasks = tasks.filter(
      (t) => new Date(t.date) >= wStart && new Date(t.date) < wEnd
    );
    weeks.push({
      week: wIndex,
      percent: percentOf(wTasks),
      taskCount: wTasks.length,
    });
    cursor = wEnd;
    wIndex += 1;
  }

  const doneCount = tasks.filter((t) => taskScore(t) >= 1).length;

  return {
    monthPercent: monthPct,
    notAchievedPercent: 100 - monthPct,
    weeks,
    totalTasks: tasks.length,
    doneTasks: doneCount,
  };
}

/* ------------------------------------------------------------------ */
/* GET /me — my tasks + analytics for a given month                    */
/* Query: ?month=YYYY-MM (defaults to current month)                   */
/* ------------------------------------------------------------------ */

router.get("/me", async (req, res) => {
  try {
    const monthStr = String(req.query.month || "");
    const base = monthStr ? new Date(`${monthStr}-01T00:00:00`) : new Date();
    const monthStart = startOfMonth(base);
    const monthEnd = endOfMonth(base);

    const tasks = await prisma.targetTask.findMany({
      where: {
        companyId: req.clientUser.companyId,
        ownerId: req.clientUser.userId, // SELF ONLY — cannot be overridden
        date: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { date: "asc" },
    });

    return res.json({
      success: true,
      tasks: tasks.map(formatTask),
      analytics: buildAnalytics(tasks, monthStart),
    });
  } catch (error) {
    console.error("Failed to load my targets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load targets" });
  }
});

/* ------------------------------------------------------------------ */
/* POST / — create a task                                              */
/* Employees create SELF tasks for themselves.                         */
/* Admins/permitted users can assign to another user (ASSIGNED).       */
/* ------------------------------------------------------------------ */

router.post("/", async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const type = VALID_TYPES.includes(req.body?.type)
      ? req.body.type
      : "CHECKLIST";
    const targetValue =
      type === "NUMERIC" ? Number(req.body?.targetValue || 0) : null;
    const dateStr = String(req.body?.date || "");
    const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());

    // Determine owner. If an ownerId is provided and differs from me,
    // this is an assignment — requires team permission.
    const requestedOwner = String(req.body?.ownerId || "").trim();
    let ownerId = req.clientUser.userId;
    let source = "SELF";
    let assignedByUserId = null;

    if (requestedOwner && requestedOwner !== req.clientUser.userId) {
      const allowed = await canViewTeam(req);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "You cannot assign tasks to other users",
        });
      }
      // Ensure the target owner is in the same company.
      const target = await prisma.user.findFirst({
        where: {
          id: requestedOwner,
          companyId: req.clientUser.companyId,
          active: true,
        },
        select: { id: true },
      });
      if (!target) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      ownerId = requestedOwner;
      source = "ASSIGNED";
      assignedByUserId = req.clientUser.userId;
    }

    const task = await prisma.targetTask.create({
      data: {
        companyId: req.clientUser.companyId,
        ownerId,
        title,
        source,
        assignedByUserId,
        date,
        type,
        targetValue,
        currentValue: 0,
        status: "NOT_STARTED",
      },
    });

    return res.json({ success: true, task: formatTask(task) });
  } catch (error) {
    console.error("Failed to create target:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create task" });
  }
});

/* ------------------------------------------------------------------ */
/* PATCH /:id — update status / currentValue                           */
/* Owner can update their own tasks. Assigner can update tasks they    */
/* assigned. Nobody else.                                              */
/* ------------------------------------------------------------------ */

router.patch("/:id", async (req, res) => {
  try {
    const task = await prisma.targetTask.findUnique({
      where: { id: req.params.id },
    });
    if (!task || task.companyId !== req.clientUser.companyId) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const isOwner = task.ownerId === req.clientUser.userId;
    const isAssigner = task.assignedByUserId === req.clientUser.userId;
    if (!isOwner && !isAssigner) {
      return res
        .status(403)
        .json({ success: false, message: "Not allowed" });
    }

    const data = {};
    if (VALID_STATUSES.includes(req.body?.status)) {
      data.status = req.body.status;
    }
    if (req.body?.currentValue !== undefined && task.type === "NUMERIC") {
      data.currentValue = Math.max(0, Number(req.body.currentValue) || 0);
      // Auto-complete a numeric task when it reaches its target.
      if (
        task.targetValue &&
        data.currentValue >= task.targetValue &&
        !req.body?.status
      ) {
        data.status = "DONE";
      }
    }
    // Only the owner may rename their own SELF task.
    if (
      req.body?.title !== undefined &&
      isOwner &&
      task.source === "SELF"
    ) {
      const t = String(req.body.title).trim();
      if (t) data.title = t;
    }

    const updated = await prisma.targetTask.update({
      where: { id: task.id },
      data,
    });

    return res.json({ success: true, task: formatTask(updated) });
  } catch (error) {
    console.error("Failed to update target:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to update task" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /:id — delete a task                                         */
/* Owner can delete their own SELF tasks.                              */
/* Assigner (admin) can delete tasks they assigned.                    */
/* An employee CANNOT delete an ASSIGNED task.                         */
/* ------------------------------------------------------------------ */

router.delete("/:id", async (req, res) => {
  try {
    const task = await prisma.targetTask.findUnique({
      where: { id: req.params.id },
    });
    if (!task || task.companyId !== req.clientUser.companyId) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const canDelete =
      (task.source === "SELF" && task.ownerId === req.clientUser.userId) ||
      (task.source === "ASSIGNED" &&
        task.assignedByUserId === req.clientUser.userId);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this task",
      });
    }

    await prisma.targetTask.delete({ where: { id: task.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete target:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete task" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /team — admin/permitted: roster of all employees + their %      */
/* Query: ?month=YYYY-MM                                               */
/* ------------------------------------------------------------------ */

router.get("/team", async (req, res) => {
  try {
    const allowed = await canViewTeam(req);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view team targets",
      });
    }

    const monthStr = String(req.query.month || "");
    const base = monthStr ? new Date(`${monthStr}-01T00:00:00`) : new Date();
    const monthStart = startOfMonth(base);
    const monthEnd = endOfMonth(base);

    const users = await prisma.user.findMany({
      where: { companyId: req.clientUser.companyId, active: true },
      select: { id: true, name: true, email: true, jobTitle: true },
      orderBy: { name: "asc" },
    });

    const tasks = await prisma.targetTask.findMany({
      where: {
        companyId: req.clientUser.companyId,
        date: { gte: monthStart, lt: monthEnd },
      },
    });

    const byOwner = new Map();
    tasks.forEach((t) => {
      if (!byOwner.has(t.ownerId)) byOwner.set(t.ownerId, []);
      byOwner.get(t.ownerId).push(t);
    });

    const roster = users.map((u) => {
      const owned = byOwner.get(u.id) || [];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        jobTitle: u.jobTitle,
        percent: percentOf(owned),
        taskCount: owned.length,
      };
    });

    const avg =
      roster.length > 0
        ? Math.round(
            roster.reduce((a, r) => a + r.percent, 0) / roster.length
          )
        : 0;

    return res.json({
      success: true,
      teamAverage: avg,
      roster,
    });
  } catch (error) {
    console.error("Failed to load team targets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load team targets" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /user/:userId — admin/permitted: one employee's full page       */
/* Query: ?month=YYYY-MM                                               */
/* ------------------------------------------------------------------ */

router.get("/user/:userId", async (req, res) => {
  try {
    const allowed = await canViewTeam(req);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this",
      });
    }

    const owner = await prisma.user.findFirst({
      where: {
        id: req.params.userId,
        companyId: req.clientUser.companyId,
      },
      select: { id: true, name: true, email: true, jobTitle: true },
    });
    if (!owner) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const monthStr = String(req.query.month || "");
    const base = monthStr ? new Date(`${monthStr}-01T00:00:00`) : new Date();
    const monthStart = startOfMonth(base);
    const monthEnd = endOfMonth(base);

    const tasks = await prisma.targetTask.findMany({
      where: {
        companyId: req.clientUser.companyId,
        ownerId: owner.id,
        date: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { date: "asc" },
    });

    return res.json({
      success: true,
      owner,
      tasks: tasks.map(formatTask),
      analytics: buildAnalytics(tasks, monthStart),
    });
  } catch (error) {
    console.error("Failed to load user targets:", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to load user targets" });
  }
});

export default router;