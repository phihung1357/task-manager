const express = require("express");
const taskController = require("../controllers/task.controller");

const router = express.Router();

router.get("/tasks", taskController.getAll);
router.post("/tasks", taskController.create);
router.patch("/tasks/:id", taskController.update);
router.delete("/tasks/:id", taskController.remove);

module.exports = router;
