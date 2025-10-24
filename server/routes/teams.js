import express from "express";
import {
  createTeam,
  getAllTeams,
  getTeamById,
  getMyTeam,
  updateTeam,
  addTeamMember,
  removeTeamMember,
  deleteTeam,
  getTeamMembers,
  getTeamsForRegistration,
} from "../controllers/teamController.js";
import {
  authenticateToken,
  requireRole,
  checkTeamAccess,
} from "../middleware/auth.js";
import { validateTeam, validateRequest } from "../utils/validation.js";
import { body, param } from "express-validator";

const router = express.Router();

// Public routes (no authentication required)
router.get("/public", getTeamsForRegistration);

// All routes below require authentication
router.use(authenticateToken);

// Get current user's team
router.get("/my-team", getMyTeam);

// Admin only routes
router.get("/", requireRole("Admin"), getAllTeams);
router.post("/", requireRole("Admin"), validateTeam, createTeam);
router.delete(
  "/:teamId",
  [
    requireRole("Admin"),
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    validateRequest,
  ],
  deleteTeam
);

// Routes accessible by Admin and team members
router.get(
  "/:teamId",
  [
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    validateRequest,
    checkTeamAccess,
  ],
  getTeamById
);

router.get(
  "/:teamId/members",
  [
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    validateRequest,
    checkTeamAccess,
  ],
  getTeamMembers
);

// Admin and Manager routes
router.put(
  "/:teamId",
  [
    requireRole("Admin"),
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Team name cannot be empty")
      .isLength({ max: 100 })
      .withMessage("Team name cannot exceed 100 characters"),
    body("manager")
      .optional()
      .isMongoId()
      .withMessage("Manager must be a valid user ID"),
    body("members")
      .optional()
      .isArray()
      .withMessage("Members must be an array"),
    validateRequest,
  ],
  updateTeam
);

router.post(
  "/:teamId/members",
  [
    requireRole("Admin", "Manager"),
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    body("userId")
      .isMongoId()
      .withMessage("User ID is required and must be valid"),
    validateRequest,
  ],
  addTeamMember
);

router.delete(
  "/:teamId/members/:userId",
  [
    requireRole("Admin", "Manager"),
    param("teamId").isMongoId().withMessage("Invalid team ID"),
    param("userId").isMongoId().withMessage("Invalid user ID"),
    validateRequest,
  ],
  removeTeamMember
);

export default router;
