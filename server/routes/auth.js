import express from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  refreshToken,
  updateUserProfile,
  changePassword,
} from "../controllers/authController.js";
import {
  authenticateToken,
  loginLimiter,
  registerLimiter,
} from "../middleware/auth.js";
import {
  validateRegistration,
  validateLogin,
  validateRequest,
} from "../utils/validation.js";
import { body } from "express-validator";

const router = express.Router();

// Public routes
router.post("/register", registerLimiter, validateRegistration, registerUser);
router.post("/login", loginLimiter, validateLogin, loginUser);
router.post("/refresh", refreshToken);

// Protected routes
router.use(authenticateToken); // All routes below require authentication

router.post("/logout", logoutUser);
router.get("/profile", getUserProfile);
router.put(
  "/profile",
  [
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

    validateRequest,
  ],
  updateUserProfile
);

router.put(
  "/change-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters long")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    validateRequest,
  ],
  changePassword
);

export default router;
