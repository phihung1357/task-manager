import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { getTasks, createTask, updateTask, deleteTask } from "./api/tasksApi";

// ---- helpers: unwrap response + normalize task ----
function unwrap(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    if (Array.isArray(res.data)) return res.data;
    if (res.data != null) return res.data;
  }
  return res;
}

function normalizeTask(t) {
  if (!t || typeof t !== "object") return null;
  return {
    id: t.id ?? t._id ?? t.taskId ?? t.uuid,
    title: t.title ?? t.name ?? "",
    completed: Boolean(t.completed ?? t.done ?? false),
  };
}

function ensureArrayTasks(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map(normalizeTask).filter(Boolean).filter((t) => t.id != null);
}

// ✅ Task 6: filter persist keys
const FILTER_KEY = "task_filter_v1";
const FILTERS = ["all", "active", "completed"];
function readSavedFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    return FILTERS.includes(saved) ? saved : "all";
  } catch {
    return "all";
  }
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  // ✅ Task 6: init from localStorage
  const [filter, setFilter] = useState(() => readSavedFilter());

  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const [deletingIds, setDeletingIds] = useState(() => new Set());

  const [error, setError] = useState("");

  // ✅ Task 5: confirm delete modal state
  const [confirm, setConfirm] = useState({
    open: false,
    taskId: null,
    taskTitle: "",
  });

  // ✅ Task 5: toast
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const inputRef = useRef(null);

  function focusInput() {
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function showToast(type, message, ttlMs = 2000) {
    setToast({ type, message });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, ttlMs);
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ✅ Task 6: persist filter whenever changes
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, filter);
    } catch {}
  }, [filter]);

  const filteredTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const counts = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => !t.completed).length;
    return { total, active };
  }, [tasks]);

  async function loadTasks() {
    setError("");
    setIsFetching(true);
    try {
      const res = await getTasks();
      const data = unwrap(res);
      setTasks(ensureArrayTasks(data));
    } catch (e) {
      const msg = e?.message || "Không thể tải danh sách task.";
      setError(msg);
      showToast("error", msg, 2500);
    } finally {
      setIsFetching(false);
      focusInput();
    }
  }

  useEffect(() => {
    loadTasks();
    focusInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      focusInput();
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const res = await createTask(trimmed);
      const rawTask = unwrap(res);
      const newTask = normalizeTask(rawTask);

      if (!newTask || newTask.id == null) {
        await loadTasks();
      } else {
        setTasks((prev) => [newTask, ...prev]);
      }

      setTitle("");

      // (tuỳ chọn UX) nếu đang ở completed, task mới sẽ không hiện -> chuyển về all
      if (filter === "completed") setFilter("all");

      showToast("success", "✅ Added");
    } catch (e) {
      const msg = e?.message || "Tạo task thất bại.";
      setError(msg);
      showToast("error", msg, 2500);
    } finally {
      setIsCreating(false);
      focusInput();
    }
  }

  async function handleToggle(task) {
    setError("");
    setUpdatingIds((prev) => new Set(prev).add(task.id));

    // optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );

    try {
      await updateTask(task.id, { completed: !task.completed });
      showToast("success", task.completed ? "↩️ Marked Active" : "✅ Completed");
    } catch (e) {
      // rollback
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t))
      );
      const msg = e?.message || "Cập nhật trạng thái thất bại.";
      setError(msg);
      showToast("error", msg, 2500);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  // ✅ Task 5: open confirm modal
  function requestDelete(task) {
    setConfirm({ open: true, taskId: task.id, taskTitle: task.title });
  }

  function closeConfirm() {
    setConfirm({ open: false, taskId: null, taskTitle: "" });
    focusInput();
  }

  async function confirmDelete() {
    const taskId = confirm.taskId;
    if (!taskId) return;

    setError("");
    setDeletingIds((prev) => new Set(prev).add(taskId));

    const snapshot = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await deleteTask(taskId);
      showToast("success", "🗑️ Deleted");
      closeConfirm();
    } catch (e) {
      setTasks(snapshot);
      const msg = e?.message || "Xoá task thất bại.";
      setError(msg);
      showToast("error", msg, 2500);
      closeConfirm();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }

  const isUpdating = (id) => updatingIds.has(id);
  const isDeleting = (id) => deletingIds.has(id);

  return (
    <div className="container">
      {/* Toast */}
      {toast ? (
        <div className={`toast ${toast.type}`}>
          {toast.message}
          <button className="toastClose" onClick={() => setToast(null)} type="button">
            ✕
          </button>
        </div>
      ) : null}

      <h1>Task Manager</h1>

      <p className="muted">
        {counts.active} task chưa hoàn thành / {counts.total} tổng
      </p>

      {/* Filters */}
      <div className="filters">
        <button
          className={filter === "all" ? "chip active" : "chip"}
          onClick={() => setFilter("all")}
          disabled={isFetching}
          type="button"
        >
          All
        </button>
        <button
          className={filter === "active" ? "chip active" : "chip"}
          onClick={() => setFilter("active")}
          disabled={isFetching}
          type="button"
        >
          Active
        </button>
        <button
          className={filter === "completed" ? "chip active" : "chip"}
          onClick={() => setFilter("completed")}
          disabled={isFetching}
          type="button"
        >
          Completed
        </button>
      </div>

      {/* Add */}
      <form className="row" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nhập task mới..."
          disabled={isFetching}
        />
        <button
          type="submit"
          disabled={isCreating || isFetching || !title.trim()}
        >
          {isCreating ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Error */}
      {error ? (
        <div className="errorBox">
          <div className="errorTitle">Request failed</div>
          <div className="errorMsg">{error}</div>
          <button className="smallBtn" onClick={loadTasks} disabled={isFetching} type="button">
            {isFetching ? "Loading..." : "Retry"}
          </button>
        </div>
      ) : null}

      {isFetching ? <div className="loadingBox">Đang tải danh sách task...</div> : null}

      {!isFetching && filteredTasks.length === 0 ? (
        <p className="muted">Không có task nào trong filter này.</p>
      ) : (
        <div className="list">
          {filteredTasks.map((t) => {
            const disabled = isUpdating(t.id) || isDeleting(t.id);
            return (
              <div key={t.id} className="item">
                <div className="left">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => handleToggle(t)}
                    disabled={disabled}
                  />
                  <span className={t.completed ? "title done" : "title"}>{t.title}</span>
                  {isUpdating(t.id) ? <span className="badge">Saving...</span> : null}
                  {isDeleting(t.id) ? <span className="badge">Deleting...</span> : null}
                </div>

                <button
                  className="danger"
                  onClick={() => requestDelete(t)}
                  disabled={disabled}
                  type="button"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.open ? (
        <div className="modalOverlay" onMouseDown={closeConfirm}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalTitle">Delete task?</div>
            <div className="modalBody">
              Bạn có chắc muốn xoá: <b>{confirm.taskTitle}</b> ?
            </div>
            <div className="modalActions">
              <button className="smallBtn" onClick={closeConfirm} type="button">
                Cancel
              </button>
              <button className="danger" onClick={confirmDelete} type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
