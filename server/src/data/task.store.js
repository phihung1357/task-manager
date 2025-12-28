let tasks = [];

function getAll() {
  return tasks;
}

function create(title) {
  const task = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  return task;
}

function update(id, patch) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = { ...tasks[idx], ...patch };
  return tasks[idx];
}

function remove(id) {
  const before = tasks.length;
  tasks = tasks.filter((t) => t.id !== id);
  return tasks.length !== before;
}

module.exports = { getAll, create, update, remove };
