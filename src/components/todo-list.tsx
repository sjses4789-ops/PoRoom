"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createTodo, updateTodo, deleteTodo, completeTodo } from "@/lib/todos";
import { TodoHistoryPopover } from "./todo-history-popover";

export type Todo = { id: string; content: string };

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const t = useTranslations("common");
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const add = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const result = await createTodo(content);
    if ("error" in result) return;
    setTodos((prev) => [...prev, result]);
  };

  // 체크하면 목록에서는(빠르게 훑어보는 화면이니) 사라지지만, 이제는
  // 삭제가 아니라 완료 처리라 "+더보기" 기록에는 그대로 남는다.
  const check = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await completeTodo(id);
  };

  const remove = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await deleteTodo(id);
  };

  const startEdit = (t: Todo) => {
    setEditingId(t.id);
    setEditValue(t.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const content = editValue.trim();
    const id = editingId;
    setEditingId(null);
    if (!content) return;
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, content } : t)));
    await updateTodo(id, content);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("todo.addPlaceholder")}
          className="flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
        />
        <button
          type="button"
          onClick={add}
          title={t("add")}
          aria-label={t("add")}
          className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          +
        </button>
      </div>

      {todos.length === 0 ? (
        <p className="text-[12px] text-neutral-400">{t("todo.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {todos.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={() => check(t.id)}
                className="shrink-0 accent-neutral-900"
              />
              {editingId === t.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  onBlur={saveEdit}
                  className="min-w-0 flex-1 rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-400"
                />
              ) : (
                <span
                  onClick={() => startEdit(t)}
                  className="min-w-0 flex-1 cursor-text truncate text-xs text-neutral-700 dark:text-neutral-200"
                >
                  {t.content}
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="shrink-0 text-neutral-300 transition hover:text-red-500 dark:text-neutral-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setHistoryOpen(true)}
        className="self-start text-[11px] font-medium text-neutral-400 transition hover:text-neutral-700 dark:hover:text-neutral-200"
      >
        {t("todo.moreButton")}
      </button>

      {historyOpen && <TodoHistoryPopover onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
