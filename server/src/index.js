/**
 * Entry point for Task Manager backend
 * Responsible for initializing the Express server
 */

const express = require("express");
const cors = require("cors");

const app = express();

/**
 * Middlewares
 */

// Allow cross-origin requests from frontend
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

/**
 * Routes
 */

// Health check endpoint
// Used to confirm that API is running correctly
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "task-manager-api",
  });
});

// Root endpoint (for quick manual testing)
app.get("/", (req, res) => {
  res.send("Task Manager API is running. Try GET /health");
});

/**
 * Server bootstrap
 */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
