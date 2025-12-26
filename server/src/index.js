const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "task-manager-api" });
});

const PORT = process.env.PORT || 4000;
app.get("/", (req, res) => {
  res.send("Task Manager API is running. Try GET /health");
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
