import User from "../models/user.js";
import Team from "../models/team.js";
import { validatePasswordStrength } from "../utils/validation.js";

// Create user (Admin can create any user, Manager can create users in their team)
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role = "User", team } = req.body;
    const currentUser = req.user;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Password does not meet requirements",
        errors: passwordValidation.errors,
      });
    }

    // Manager-specific restrictions
    if (currentUser.role === "Manager") {
      // Manager can only create Users (not Admin or other Managers)
      if (role !== "User") {
        return res.status(403).json({
          success: false,
          message: "Managers can only create users with 'User' role",
        });
      }

      // Manager must have a team
      if (!currentUser.team) {
        return res.status(400).json({
          success: false,
          message: "You are not assigned to a team",
        });
      }

      // If team is provided, it must be the manager's team
      if (team && team !== currentUser.team._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only create users in your own team",
        });
      }

      // If team is not provided, use manager's team
      if (!team) {
        req.body.team = currentUser.team._id.toString();
      }
    }

    // Admin restrictions
    if (currentUser.role === "Admin") {
      // Validate team requirement for Manager and User roles
      if ((role === "Manager" || role === "User") && !team) {
        return res.status(400).json({
          success: false,
          message: "Team is required for Manager and User roles",
        });
      }

      // If creating a Manager, check if team already has a manager
      if (role === "Manager" && team) {
        const targetTeam = await Team.findById(team);
        if (!targetTeam) {
          return res.status(404).json({
            success: false,
            message: "Team not found",
          });
        }
        if (targetTeam.manager) {
          return res.status(400).json({
            success: false,
            message: "This team already has a manager assigned",
          });
        }
      }
    }

    // Validate team exists if provided
    if (req.body.team || team) {
      const teamId = req.body.team || team;
      const teamExists = await Team.findById(teamId);
      if (!teamExists) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }
    }

    // Create user
    const newUser = new User({
      username,
      email,
      password,
      role: currentUser.role === "Manager" ? "User" : role, // Force User role for managers
      team: req.body.team || team || undefined,
    });

    await newUser.save();

    // Update team members and manager if applicable
    const finalTeam = req.body.team || team;
    if (finalTeam) {
      const teamUpdate = {
        $addToSet: { members: newUser._id },
      };

      // If creating a Manager, set them as team manager
      if (role === "Manager" && currentUser.role === "Admin") {
        teamUpdate.$set = { manager: newUser._id };
      }

      await Team.findByIdAndUpdate(finalTeam, teamUpdate);
    }

    // Return user without password
    const userResponse = await User.findById(newUser._id)
      .populate("team", "name")
      .select("-password -refreshTokens");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    console.error("=== CREATE USER ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("User performing action:", req.user?.username, `(${req.user?.role})`);
    console.error("=========================");
    res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Get team members (Manager can view their team, Admin can view all)
export const getTeamMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let filter = {};

    // Managers can only see their team members
    if (req.user.role === "Manager") {
      if (!req.user.team) {
        return res.status(400).json({
          success: false,
          message: "You are not assigned to a team",
        });
      }
      filter.team = req.user.team._id;
    }
    // Admin sees all users (no filter applied)

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .populate("team", "name")
      .select("-password -refreshTokens")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("=== GET TEAM MEMBERS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Query params:", req.query);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("User team:", req.user?.team);
    console.error("==============================");
    res.status(500).json({
      success: false,
      message: "Failed to get team members",
      error: error.message,
    });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, team } = req.query;

    let filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (team) {
      filter.team = team;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .populate("team", "name")
      .select("-password -refreshTokens")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("=== GET ALL USERS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Query params:", req.query);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("===========================");
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
};

// Get user by ID (Admin only)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate("team", "name manager members")
      .select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("=== GET USER BY ID ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("User ID requested:", req.params.userId);
    console.error("User performing action:", req.user?.username, `(${req.user?.role})`);
    console.error("============================");
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email, role, team } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            existingUser.username === username
              ? "Username already taken"
              : "Email already registered",
        });
      }
    }

    // Handle team change
    if (team !== undefined) {
      const oldTeam = user.team;
      const newRole = role || user.role;

      // If team is being changed
      if (team && team !== oldTeam?.toString()) {
        // Validate new team exists
        const newTeam = await Team.findById(team);
        if (!newTeam) {
          return res.status(404).json({
            success: false,
            message: "Team not found",
          });
        }

        // If user is a Manager, check if team already has a manager
        if (newRole === "Manager") {
          if (newTeam.manager && newTeam.manager.toString() !== userId) {
            return res.status(400).json({
              success: false,
              message: "This team already has a manager assigned",
            });
          }
        }

        // Remove from old team if exists
        if (oldTeam) {
          const oldTeamDoc = await Team.findById(oldTeam);
          // If user was the manager of old team, unset manager
          if (oldTeamDoc && oldTeamDoc.manager?.toString() === userId) {
            await Team.findByIdAndUpdate(oldTeam, {
              $pull: { members: userId },
              $unset: { manager: 1 },
            });
          } else {
            await Team.findByIdAndUpdate(oldTeam, {
              $pull: { members: userId },
            });
          }
        }

        // Add to new team
        const teamUpdate = {
          $addToSet: { members: userId },
        };

        // If user is a Manager, set them as the team manager
        if (newRole === "Manager") {
          teamUpdate.$set = { manager: userId };
        }

        await Team.findByIdAndUpdate(team, teamUpdate);
      } else if (!team && oldTeam) {
        // Removing from team
        const oldTeamDoc = await Team.findById(oldTeam);
        // If user was the manager, unset manager
        if (oldTeamDoc && oldTeamDoc.manager?.toString() === userId) {
          await Team.findByIdAndUpdate(oldTeam, {
            $pull: { members: userId },
            $unset: { manager: 1 },
          });
        } else {
          await Team.findByIdAndUpdate(oldTeam, {
            $pull: { members: userId },
          });
        }
      }
    }

    // Handle role change without team change
    if (role && !team && user.team) {
      const currentTeam = await Team.findById(user.team);

      // If changing TO Manager role
      if (role === "Manager" && user.role !== "Manager") {
        // Check if team already has a manager
        if (currentTeam.manager && currentTeam.manager.toString() !== userId) {
          return res.status(400).json({
            success: false,
            message: "This team already has a manager assigned. Please remove the current manager first.",
          });
        }
        // Set this user as the team manager
        await Team.findByIdAndUpdate(user.team, {
          $set: { manager: userId },
        });
      }

      // If changing FROM Manager role to another role
      if (role !== "Manager" && user.role === "Manager") {
        // Check if user is the manager of their current team
        if (currentTeam && currentTeam.manager?.toString() === userId) {
          await Team.findByIdAndUpdate(user.team, {
            $unset: { manager: 1 },
          });
        }
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...(username && { username }),
        ...(email && { email }),
        ...(role && { role }),
        ...(team !== undefined && { team: team || null }),
      },
      { new: true, runValidators: true }
    ).populate("team", "name");

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("=== UPDATE USER ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("User ID:", req.params.userId);
    console.error("Request body:", req.body);
    console.error("User performing action:", req.user?.username, `(${req.user?.role})`);
    console.error("========================");
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove user from team if exists
    if (user.team) {
      await Team.findByIdAndUpdate(user.team, {
        $pull: { members: userId },
      });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("=== DELETE USER ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("User ID to delete:", req.params.userId);
    console.error("User performing action:", req.user?.username, `(${req.user?.role})`);
    console.error("=========================");
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Get user statistics (Admin only)
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "Admin" });
    const managerCount = await User.countDocuments({ role: "Manager" });
    const userCount = await User.countDocuments({ role: "User" });
    const usersWithTeams = await User.countDocuments({
      team: { $exists: true, $ne: null },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          adminCount,
          managerCount,
          userCount,
          usersWithTeams,
          usersWithoutTeams: totalUsers - usersWithTeams,
        },
      },
    });
  } catch (error) {
    console.error("=== GET USER STATS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("============================");
    res.status(500).json({
      success: false,
      message: "Failed to get user statistics",
      error: error.message,
    });
  }
};
