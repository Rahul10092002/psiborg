import express from "express";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTask,
  getMyTasks,
  getTaskStats,
} from "../controllers/taskController.js";
import {
  authenticateToken,
  requireRole,
  checkTaskAccess,
} from "../middleware/auth.js";
import {
  validateTask,
  validateTaskUpdate,
  validateRequest,
} from "../utils/validation.js";
import { body, param } from "express-validator";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Task statistics - accessible to all authenticated users
router.get("/stats", getTaskStats);

// Get tasks assigned to current user
router.get("/my-tasks", getMyTasks);

// Get all tasks (with filtering and pagination)
router.get("/", getTasks);

// Create a new task
router.post("/", validateTask, createTask);

// Get a specific task by ID
router.get(
  "/:taskId",
  [
    param("taskId").isMongoId().withMessage("Invalid task ID"),
    validateRequest,
    checkTaskAccess,
  ],
  getTaskById
);

// Update a task
router.put(
  "/:taskId",
  [
    param("taskId").isMongoId().withMessage("Invalid task ID"),
    validateRequest,
    checkTaskAccess,
    validateTaskUpdate,
  ],
  updateTask
);

// Delete a task
router.delete(
  "/:taskId",
  [
    param("taskId").isMongoId().withMessage("Invalid task ID"),
    validateRequest,
    checkTaskAccess,
  ],
  deleteTask
);

// Assign task to user (Admin and Manager only)
router.put(
  "/:taskId/assign",
  [
    requireRole("Admin", "Manager"),
    param("taskId").isMongoId().withMessage("Invalid task ID"),
    body("assignedTo").isMongoId().withMessage("Invalid user ID"),
    validateRequest,
    checkTaskAccess,
  ],
  assignTask
);

export default router;
