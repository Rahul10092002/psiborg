import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getTeamMembers,
} from "../controllers/userController.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { body, param } from "express-validator";
import { validateRequest } from "../utils/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Routes accessible by Admin and Manager
// Get team members (Manager sees their team, Admin sees all)
router.get("/team-members", requireRole("Admin", "Manager"), getTeamMembers);

// Create user (Admin can create any user, Manager can create users in their team)
router.post(
  "/",
  [
    requireRole("Admin", "Manager"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
    body("role")
      .optional()
      .isIn(["Admin", "Manager", "User"])
      .withMessage("Role must be Admin, Manager, or User"),
    body("team")
      .optional()
      .custom((value) => {
        if (value === null || value === "") return true;
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error("Team must be a valid MongoDB ObjectId");
        }
        return true;
      }),
    validateRequest,
  ],
  createUser
);

// Admin-only routes
router.use(requireRole("Admin"));

// Get user statistics
router.get("/stats", getUserStats);

// Get all users with pagination and filtering
router.get("/", getAllUsers);

// Get user by ID
router.get(
  "/:userId",
  [
    param("userId").isMongoId().withMessage("Invalid user ID"),
    validateRequest,
  ],
  getUserById
);

// Update user
router.put(
  "/:userId",
  [
    param("userId").isMongoId().withMessage("Invalid user ID"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),
    body("role")
      .optional()
      .isIn(["Admin", "Manager", "User"])
      .withMessage("Role must be Admin, Manager, or User"),
    body("team")
      .optional()
      .custom((value) => {
        if (value === null || value === "") return true;
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error("Team must be a valid MongoDB ObjectId");
        }
        return true;
      }),
    validateRequest,
  ],
  updateUser
);

// Delete user
router.delete(
  "/:userId",
  [
    param("userId").isMongoId().withMessage("Invalid user ID"),
    validateRequest,
  ],
  deleteUser
);

export default router;
