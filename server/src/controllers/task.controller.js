const store = require("../data/task.store");

exports.getAll = (req, res) => {
  const tasks = store.getAll();
  res.json({ ok: true, data: tasks });
};

exports.create = (req, res) => {
  const { title } = req.body || {};
  if (!title || String(title).trim() === "") {
    return res.status(400).json({ ok: false, error: "Title is required" });
  }

  const task = store.create(String(title).trim());
  res.status(201).json({ ok: true, data: task });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};

  const updated = store.update(id, patch);
  if (!updated) {
    return res.status(404).json({ ok: false, error: "Task not found" });
  }

  res.json({ ok: true, data: updated });
};

exports.remove = (req, res) => {
  const { id } = req.params;
  const ok = store.remove(id);

  if (!ok) {
    return res.status(404).json({ ok: false, error: "Task not found" });
  }

  res.status(204).send();
};
