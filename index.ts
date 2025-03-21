import express from "express";
import { Sequelize, DataTypes } from "sequelize";
import path from "path";

// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public directory

// PostgreSQL database configuration
const sequelize = new Sequelize("feedback_db", "postgres", "slayappios#123", {
  host: "database-1.cvwckiuue2p2.us-east-1.rds.amazonaws.com", // Replace with your RDS endpoint
  port: 5432,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Bypass certificate validation (not recommended for production)
    },
  },
});

// Define the Feedback model
const Feedback = sequelize.define(
  "Feedback",
  {
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    feedback_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
  },
  {
    tableName: "feedback", // Name of the table in the database
    timestamps: false, // Disable createdAt and updatedAt fields
  }
);

// Sync the model with the database
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    await Feedback.sync(); // Create the table if it doesn't exist
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// GET /feedback - Get all feedback
app.get("/feedback", async (req, res) => {
  try {
    const feedback = await Feedback.findAll();
    res.status(200).json(feedback);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST /feedback - Submit feedback
app.post("/feedback", async (req, res) => {
  try {
    const { stars, feedback_text, email } = req.body;

    // Validate input
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Stars must be an integer between 1 and 5." });
    }
    if (typeof feedback_text !== "string" || feedback_text.trim() === "") {
      return res.status(400).json({ error: "Feedback text is required." });
    }
    if (typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required." });
    }

    // Create a new feedback entry
    const feedback = await Feedback.create({ stars, feedback_text, email });

    res.status(200).json({ message: "Feedback submitted successfully!", data: feedback });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Default route - serve the HTML dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});