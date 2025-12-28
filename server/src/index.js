const express = require("express");
const cors = require("cors");
const taskRoutes = require("./routes/task.routes");

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use(taskRoutes);

// health check
app.get("/", (req, res) => res.send("OK"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
