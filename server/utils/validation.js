import { body, validationResult } from "express-validator";

// Validation middleware
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// User registration validation
export const validateRegistration = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("role")
    .optional()
    .isIn(["Admin", "Manager", "User"])
    .withMessage("Role must be Admin, Manager, or User"),

  body("team")
    .optional()
    .custom((value, { req }) => {
      // If role is Admin, team is not required
      if (req.body.role === "Admin") {
        return true;
      }
      // If role is Manager or User, team is required and must be a valid MongoDB ID
      if (req.body.role === "Manager" || req.body.role === "User") {
        if (!value) {
          throw new Error("Team is required for Manager and User roles");
        }
        if (!value.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error("Team must be a valid MongoDB ObjectId");
        }
      }
      return true;
    }),

  validateRequest,
];

// User login validation
export const validateLogin = [
  body("identifier").notEmpty().withMessage("Username or email is required"),

  body("password").notEmpty().withMessage("Password is required"),

  validateRequest,
];

// Task validation
export const validateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("dueDate")
    .isISO8601()
    .withMessage("Due date must be a valid date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),

  body("status")
    .optional()
    .isIn(["Pending", "In Progress", "Completed"])
    .withMessage("Status must be Pending, In Progress, or Completed"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned user must be a valid ID"),

  validateRequest,
];

// Task update validation
export const validateTaskUpdate = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty")
    .isLength({ max: 200 })
    .withMessage("Task title cannot exceed 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),

  body("status")
    .optional()
    .isIn(["Pending", "In Progress", "Completed"])
    .withMessage("Status must be Pending, In Progress, or Completed"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Assigned user must be a valid ID"),

  validateRequest,
];

// Team validation
export const validateTeam = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Team name is required")
    .isLength({ max: 100 })
    .withMessage("Team name cannot exceed 100 characters"),

  body("manager")
    .optional()
    .custom((value) => {
      if (value && !value.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error("Manager must be a valid user ID");
      }
      return true;
    }),

  body("members")
    .optional()
    .isArray()
    .withMessage("Members must be an array")
    .custom((members) => {
      if (
        members &&
        members.some((member) => !member.match(/^[0-9a-fA-F]{24}$/))
      ) {
        throw new Error("All member IDs must be valid");
      }
      return true;
    }),

  validateRequest,
];

// Password strength validator
export const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!hasUpperCase) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!hasLowerCase) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  if (!hasSpecialChar) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
