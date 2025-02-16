const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const serverlessExpress = require("aws-serverless-express");

// Initialize Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

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
    tableName: "feedback",
    timestamps: false,
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

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Feedback API!");
});

// Export the handler for AWS Lambda
exports.handler = async (event, context) => {
  const server = serverlessExpress.createServer(app);
  return serverlessExpress.proxy(server, event, context);
};