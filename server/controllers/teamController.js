import Team from "../models/team.js";
import User from "../models/user.js";

// Get teams for registration (public endpoint)
export const getTeamsForRegistration = async (req, res) => {
  try {
    const teams = await Team.find({}, "name _id")
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 teams for registration dropdown

    res.json({
      success: true,
      data: { teams },
    });
  } catch (error) {
    console.error("=== GET TEAMS FOR REGISTRATION ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("========================================");
    res.status(500).json({
      success: false,
      message: "Failed to get teams",
      error: error.message,
    });
  }
};

// Create a new team (Admin only)
export const createTeam = async (req, res) => {
  try {
    const { name, manager, members = [] } = req.body;

    let managerUser = null;
    let teamMembers = [];

    // Validate manager if provided (optional)
    if (manager) {
      managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(404).json({
          success: false,
          message: "Manager not found",
        });
      }

      if (managerUser.role !== "Manager") {
        return res.status(400).json({
          success: false,
          message: "Selected user is not a Manager",
        });
      }

      // Check if manager is already managing another team
      const existingTeam = await Team.findOne({ manager });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: "Manager is already assigned to another team",
        });
      }

      // Include manager in members if provided
      teamMembers.push(manager);
    }

    // Validate all members exist (optional)
    if (members.length > 0) {
      const memberUsers = await User.find({ _id: { $in: members } });
      if (memberUsers.length !== members.length) {
        return res.status(400).json({
          success: false,
          message: "One or more members not found",
        });
      }

      // Check if any members are already in other teams
      const usersWithTeams = memberUsers.filter((user) => user.team);
      if (usersWithTeams.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Some users are already in other teams: ${usersWithTeams
            .map((u) => u.username)
            .join(", ")}`,
        });
      }

      // Add members to team
      teamMembers.push(...members);
    }

    // Remove duplicates from members array
    teamMembers = [...new Set(teamMembers)];

    // Create team
    const team = new Team({
      name,
      manager: manager || undefined,
      members: teamMembers,
    });

    await team.save();

    // Update manager's team reference if provided
    if (manager) {
      await User.findByIdAndUpdate(manager, { team: team._id });
    }

    // Update members' team references
    if (members.length > 0) {
      await User.updateMany({ _id: { $in: members } }, { team: team._id });
    }

    await team.populate(["manager", "members"], "username email role");

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: { team },
    });
  } catch (error) {
    console.error("=== CREATE TEAM ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("========================");
    res.status(500).json({
      success: false,
      message: "Failed to create team",
      error: error.message,
    });
  }
};

// Get all teams (Admin only)
export const getAllTeams = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const teams = await Team.find(filter)
      .populate("manager", "username email role")
      .populate("members", "username email role")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const totalTeams = await Team.countDocuments(filter);
    const totalPages = Math.ceil(totalTeams / limit);

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTeams,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("=== GET TEAMS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Query params:", req.query);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("======================");
    res.status(500).json({
      success: false,
      message: "Failed to get teams",
      error: error.message,
    });
  }
};

// Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate("manager", "username email role createdAt")
      .populate("members", "username email role createdAt");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("=== GET TEAM BY ID ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("===========================");
    res.status(500).json({
      success: false,
      message: "Failed to get team",
      error: error.message,
    });
  }
};

// Get current user's team
export const getMyTeam = async (req, res) => {
  try {
    if (!req.user.team) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to any team",
      });
    }

    const team = await Team.findById(req.user.team._id)
      .populate("manager", "username email role createdAt")
      .populate("members", "username email role createdAt");

    res.json({
      success: true,
      data: { team },
    });
  } catch (error) {
    console.error("=== GET MY TEAM ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("User team:", req.user?.team);
    console.error("========================");
    res.status(500).json({
      success: false,
      message: "Failed to get your team",
      error: error.message,
    });
  }
};

// Update team (Admin only)
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, manager, members } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // If updating manager
    if (manager && manager !== team.manager.toString()) {
      const newManager = await User.findById(manager);
      if (!newManager) {
        return res.status(404).json({
          success: false,
          message: "New manager not found",
        });
      }

      if (newManager.role !== "Manager") {
        return res.status(400).json({
          success: false,
          message: "Selected user is not a Manager",
        });
      }

      // Check if new manager is already managing another team
      const existingTeam = await Team.findOne({
        manager,
        _id: { $ne: teamId },
      });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: "Manager is already assigned to another team",
        });
      }

      // Update old manager's team reference
      await User.findByIdAndUpdate(team.manager, { $unset: { team: 1 } });

      // Update new manager's team reference
      await User.findByIdAndUpdate(manager, { team: teamId });
    }

    // If updating members
    if (members && Array.isArray(members)) {
      // Validate all members exist
      const memberUsers = await User.find({ _id: { $in: members } });
      if (memberUsers.length !== members.length) {
        return res.status(400).json({
          success: false,
          message: "One or more members not found",
        });
      }

      // Remove team reference from old members
      await User.updateMany({ team: teamId }, { $unset: { team: 1 } });

      // Add team reference to new members
      await User.updateMany(
        { _id: { $in: [...members, manager || team.manager] } },
        { team: teamId }
      );
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      {
        ...(name && { name }),
        ...(manager && { manager }),
        ...(members && { members: [...members, manager || team.manager] }),
      },
      { new: true, runValidators: true }
    ).populate(["manager", "members"], "username email role");

    res.json({
      success: true,
      message: "Team updated successfully",
      data: { team: updatedTeam },
    });
  } catch (error) {
    console.error("=== UPDATE TEAM ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("Request body:", req.body);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("========================");
    res.status(500).json({
      success: false,
      message: "Failed to update team",
      error: error.message,
    });
  }
};

// Add member to team (Admin and Manager)
export const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if current user can add members to this team
    if (
      req.user.role === "Manager" &&
      team.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add members to your own team",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.team) {
      return res.status(400).json({
        success: false,
        message: "User is already in a team",
      });
    }

    // Add user to team
    team.members.push(userId);
    await team.save();

    // Update user's team reference
    user.team = teamId;
    await user.save();

    await team.populate(["manager", "members"], "username email role");

    res.json({
      success: true,
      message: "Member added to team successfully",
      data: { team },
    });
  } catch (error) {
    console.error("=== ADD TEAM MEMBER ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("User ID to add:", req.body.userId);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("============================");
    res.status(500).json({
      success: false,
      message: "Failed to add team member",
      error: error.message,
    });
  }
};

// Remove member from team (Admin and Manager)
export const removeTeamMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if current user can remove members from this team
    if (
      req.user.role === "Manager" &&
      team.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only remove members from your own team",
      });
    }

    // Cannot remove the manager
    if (team.manager.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove team manager. Update team manager first.",
      });
    }

    // Remove user from team
    team.members = team.members.filter(
      (member) => member.toString() !== userId
    );
    await team.save();

    // Update user's team reference
    await User.findByIdAndUpdate(userId, { $unset: { team: 1 } });

    await team.populate(["manager", "members"], "username email role");

    res.json({
      success: true,
      message: "Member removed from team successfully",
      data: { team },
    });
  } catch (error) {
    console.error("=== REMOVE TEAM MEMBER ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("User ID to remove:", req.params.userId);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("===============================");
    res.status(500).json({
      success: false,
      message: "Failed to remove team member",
      error: error.message,
    });
  }
};

// Delete team (Admin only)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Remove team reference from all team members
    await User.updateMany({ team: teamId }, { $unset: { team: 1 } });

    // Delete the team
    await Team.findByIdAndDelete(teamId);

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("=== DELETE TEAM ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("========================");
    res.status(500).json({
      success: false,
      message: "Failed to delete team",
      error: error.message,
    });
  }
};

// Get team members (accessible to team members and admins)
export const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId).populate(
      "members",
      "username email role createdAt"
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.json({
      success: true,
      data: {
        members: team.members,
        teamName: team.name,
      },
    });
  } catch (error) {
    console.error("=== GET TEAM MEMBERS ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("Team ID:", req.params.teamId);
    console.error("User:", req.user?.username, `(${req.user?.role})`);
    console.error("==============================");
    res.status(500).json({
      success: false,
      message: "Failed to get team members",
      error: error.message,
    });
  }
};
