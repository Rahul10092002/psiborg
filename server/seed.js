import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.js";
import Team from "./models/team.js";
import Task from "./models/task.js";

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/psiborg"
    );
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    console.log("Cleared existing data");

    // Create Admin user
    const adminUser = new User({
      username: "admin",
      email: "admin@psiborg.com",
      password: "AdminPass123!",
      role: "Admin",
      isEmailVerified: true,
    });
    await adminUser.save();
    console.log("Created admin user");

    // Create a temporary team document to get an ID
    const tempTeam = new Team({
      name: "Temporary Team",
      manager: adminUser._id, // Temporarily use admin as manager
      members: [],
    });
    await tempTeam.save();

    // Create Manager user with the temporary team
    const managerUser = new User({
      username: "manager1",
      email: "manager1@psiborg.com",
      password: "ManagerPass123!",
      role: "Manager",
      team: tempTeam._id,
      isEmailVerified: true,
    });
    await managerUser.save();

    // Create regular users
    const user1 = new User({
      username: "user1",
      email: "user1@psiborg.com",
      password: "UserPass123!",
      role: "User",
      team: tempTeam._id,
      isEmailVerified: true,
    });
    await user1.save();

    const user2 = new User({
      username: "user2",
      email: "user2@psiborg.com",
      password: "UserPass123!",
      role: "User",
      team: tempTeam._id,
      isEmailVerified: true,
    });
    await user2.save();

    console.log("Created users");

    // Now update the team with proper data
    tempTeam.name = "Development Team";
    tempTeam.manager = managerUser._id;
    tempTeam.members = [managerUser._id, user1._id, user2._id];
    await tempTeam.save();

    console.log("Created team and updated user references");

    // Create sample tasks
    const tasks = [
      {
        title: "Setup project structure",
        description:
          "Initialize the project with proper folder structure and configuration files",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: "High",
        status: "In Progress",
        createdBy: managerUser._id,
        assignedTo: user1._id,
        team: tempTeam._id,
      },
      {
        title: "Implement authentication",
        description:
          "Create user registration, login, and logout functionality",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        priority: "High",
        status: "Pending",
        createdBy: managerUser._id,
        assignedTo: user1._id,
        team: tempTeam._id,
      },
      {
        title: "Design user interface",
        description:
          "Create wireframes and mockups for the application interface",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority: "Medium",
        status: "Pending",
        createdBy: managerUser._id,
        assignedTo: user2._id,
        team: tempTeam._id,
      },
      {
        title: "Write unit tests",
        description: "Implement comprehensive unit tests for all modules",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        priority: "Medium",
        status: "Pending",
        createdBy: user1._id,
        assignedTo: user1._id,
        team: tempTeam._id,
      },
      {
        title: "Setup CI/CD pipeline",
        description: "Configure continuous integration and deployment",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        priority: "Low",
        status: "Pending",
        createdBy: managerUser._id,
        assignedTo: user2._id,
        team: tempTeam._id,
      },
    ];

    await Task.insertMany(tasks);
    console.log("Created sample tasks");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nDefault users created:");
    console.log("👑 Admin: admin@psiborg.com / AdminPass123!");
    console.log("👨‍💼 Manager: manager1@psiborg.com / ManagerPass123!");
    console.log("👤 User 1: user1@psiborg.com / UserPass123!");
    console.log("👤 User 2: user2@psiborg.com / UserPass123!");
    console.log("\nYou can now test the API with these credentials.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
    process.exit(0);
  }
};

// Run the seed function
seedData();
