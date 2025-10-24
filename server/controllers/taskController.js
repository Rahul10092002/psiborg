import Task from "../models/task.js";
import User from "../models/user.js";
import Team from "../models/team.js";

// Create a new task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority = "Medium",
      status = "Pending",
      assignedTo,
    } = req.body;
    const createdBy = req.user._id;

    // Validate assigned user if provided
    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo).populate("team");
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
        });
      }

      // Check if the current user can assign tasks to this user
      if (req.user.role === "Manager") {
        // Managers can only assign tasks to users in their team
        if (
          !assignedUser.team ||
          assignedUser.team._id.toString() !== req.user.team._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "You can only assign tasks to users in your team",
          });
        }
      } else if (req.user.role === "User") {
        // Users can only assign tasks to themselves
        if (assignedTo !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "You can only assign tasks to yourself",
          });
        }
      }
      // Admins can assign to anyone
    }

    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      createdBy,
      assignedTo: assignedTo || createdBy, // Assign to creator if no assignee specified
    });

    await task.save();
    await task.populate(["createdBy", "assignedTo"], "username email role");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task },
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// Get all tasks with filtering and pagination
export const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignedTo,
      createdBy,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    // Build filter object based on user role
    let filter = {};

    if (req.user.role === "Admin") {
      // Admin can see all tasks
    } else if (req.user.role === "Manager") {
      // Manager can see tasks in their team
      const teamMembers = await User.find({ team: req.user.team._id }).select(
        "_id"
      );
      const memberIds = teamMembers.map((member) => member._id);

      filter.$or = [
        { createdBy: { $in: memberIds } },
        { assignedTo: { $in: memberIds } },
      ];
    } else {
      // Users can only see their own tasks
      filter.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;

    // Add search functionality
    if (search) {
      filter.$and = [
        filter.$and || {},
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get tasks with pagination
    const tasks = await Task.find(filter)
      .populate("createdBy", "username email role")
      .populate("assignedTo", "username email role")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalTasks = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalTasks / limit);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTasks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tasks",
      error: error.message,
    });
  }
};

// Get a single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("createdBy", "username email role team")
      .populate("assignedTo", "username email role team");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Access control is handled by checkTaskAccess middleware
    res.json({
      success: true,
      data: { task },
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get task",
      error: error.message,
    });
  }
};

// Update a task
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    // Get the existing task (available from middleware)
    const task = req.task || (await Task.findById(taskId));

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Validate assignedTo if being updated
    if (updates.assignedTo) {
      const assignedUser = await User.findById(updates.assignedTo).populate(
        "team"
      );
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
        });
      }

      // Check assignment permissions
      if (req.user.role === "Manager") {
        if (
          !assignedUser.team ||
          assignedUser.team._id.toString() !== req.user.team._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "You can only assign tasks to users in your team",
          });
        }
      } else if (req.user.role === "User") {
        // Users can only assign to themselves or update their assigned tasks
        if (
          updates.assignedTo !== req.user._id.toString() &&
          task.assignedTo.toString() !== req.user._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message: "You can only assign tasks to yourself",
          });
        }
      }
    }

    // Users can only update status of tasks assigned to them (not reassign)
    if (
      req.user.role === "User" &&
      task.assignedTo.toString() === req.user._id.toString()
    ) {
      // Allow only status updates for assigned users
      const allowedUpdates = ["status"];
      const updateKeys = Object.keys(updates);
      const isValidUpdate = updateKeys.every((key) =>
        allowedUpdates.includes(key)
      );

      if (!isValidUpdate) {
        return res.status(403).json({
          success: false,
          message: "You can only update the status of tasks assigned to you",
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
      new: true,
      runValidators: true,
    }).populate(["createdBy", "assignedTo"], "username email role");

    res.json({
      success: true,
      message: "Task updated successfully",
      data: { task: updatedTask },
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Only allow task creator, admins, or managers to delete tasks
    if (
      req.user.role === "User" &&
      task.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete tasks you created",
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

// Assign task to user (separate endpoint for clarity)
export const assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "User ID is required for assignment",
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const assignedUser = await User.findById(assignedTo).populate("team");
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check assignment permissions
    if (req.user.role === "Manager") {
      if (
        !assignedUser.team ||
        assignedUser.team._id.toString() !== req.user.team._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only assign tasks to users in your team",
        });
      }
    } else if (req.user.role === "User") {
      return res.status(403).json({
        success: false,
        message: "Users cannot reassign tasks",
      });
    }

    task.assignedTo = assignedTo;
    await task.save();
    await task.populate(["createdBy", "assignedTo"], "username email role");

    res.json({
      success: true,
      message: "Task assigned successfully",
      data: { task },
    });
  } catch (error) {
    console.error("Assign task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign task",
      error: error.message,
    });
  }
};

// Get tasks assigned to current user
export const getMyTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      sortBy = "dueDate",
      sortOrder = "asc",
    } = req.query;

    let filter = { assignedTo: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const tasks = await Task.find(filter)
      .populate("createdBy", "username email role")
      .sort(sortOptions);

    res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    console.error("Get my tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get your tasks",
      error: error.message,
    });
  }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    let matchFilter = {};

    // Apply role-based filtering
    if (req.user.role === "Manager") {
      const teamMembers = await User.find({ team: req.user.team._id }).select(
        "_id"
      );
      const memberIds = teamMembers.map((member) => member._id);
      matchFilter = {
        $or: [
          { createdBy: { $in: memberIds } },
          { assignedTo: { $in: memberIds } },
        ],
      };
    } else if (req.user.role === "User") {
      matchFilter = {
        $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }],
      };
    }

    const stats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          highPriorityTasks: {
            $sum: { $cond: [{ $eq: ["$priority", "High"] }, 1, 0] },
          },
          overdueTasks: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$status", "Completed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      highPriorityTasks: 0,
      overdueTasks: 0,
    };

    res.json({
      success: true,
      data: { stats: result },
    });
  } catch (error) {
    console.error("Get task stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get task statistics",
      error: error.message,
    });
  }
};
