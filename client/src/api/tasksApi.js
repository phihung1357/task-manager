const BASE_URL = ""; // dùng Vite proxy => gọi "/tasks"

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // 204 No Content (delete)
  if (res.status === 204) return null;

  // cố parse json
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.message || json?.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  // ✅ backend trả { ok: true, data: ... } => lấy data
  if (json && typeof json === "object" && "data" in json) return json.data;

  // fallback
  return json;
}

export function getTasks() {
  return request("/tasks"); // => array
}

export function createTask(title) {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify({ title }),
  }); // => task object
}

export function updateTask(id, patch) {
  return request(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }); // => task object
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, {
    method: "DELETE",
  }); // => null
}
