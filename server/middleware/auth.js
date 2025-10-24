import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import User from "../models/user.js";

// JWT verification middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate("team");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

// Rate limiter for login attempts - TEMPORARILY DISABLED
export const loginLimiter = (req, res, next) => next();
// export const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
//   message: {
//     success: false,
//     message: "Too many login attempts, please try again later",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Rate limiter for registration - TEMPORARILY DISABLED
export const registerLimiter = (req, res, next) => next();
// export const registerLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 5,
//   message: {
//     success: false,
//     message: "Too many registration attempts, please try again later",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Middleware to check if user can access team resources
export const checkTeamAccess = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const user = req.user;

    // Admin can access all teams
    if (user.role === "Admin") {
      return next();
    }

    // Manager can only access their own team
    if (user.role === "Manager") {
      if (user.team && user.team._id.toString() === teamId) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "You can only access your own team",
      });
    }

    // Regular users can only access their own team
    if (user.role === "User") {
      if (user.team && user.team._id.toString() === teamId) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "You can only access your own team",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking team access",
    });
  }
};

// Middleware to check if user can manage tasks
export const checkTaskAccess = async (req, res, next) => {
  try {
    const user = req.user;
    const { taskId } = req.params;

    // Admin can access all tasks
    if (user.role === "Admin") {
      return next();
    }

    // For task creation, managers and users can create tasks
    if (req.method === "POST" && req.path.endsWith("/tasks")) {
      return next();
    }

    // For specific task operations, check ownership/assignment
    if (taskId) {
      const Task = (await import("../models/task.js")).default;
      const task = await Task.findById(taskId).populate("createdBy assignedTo");

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      // Manager can access tasks in their team
      if (user.role === "Manager") {
        const taskCreatorTeam = task.createdBy.team?.toString();
        const taskAssigneeTeam = task.assignedTo?.team?.toString();
        const userTeam = user.team?._id.toString();

        if (taskCreatorTeam === userTeam || taskAssigneeTeam === userTeam) {
          req.task = task;
          return next();
        }
      }

      // User can only access their own tasks (created by them or assigned to them)
      if (user.role === "User") {
        const userId = user._id.toString();
        if (
          task.createdBy._id.toString() === userId ||
          task.assignedTo?._id.toString() === userId
        ) {
          req.task = task;
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this task",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking task access",
    });
  }
};
