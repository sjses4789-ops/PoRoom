"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createTodo, updateTodo, deleteTodo } from "@/lib/todos";

export type Todo = { id: string; content: string };

export function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const t = useTranslations("common");
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const add = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const result = await createTodo(content);
    if ("error" in result) return;
    setTodos((prev) => [...prev, result]);
  };

  const check = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await deleteTodo(id);
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
          className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {t("add")}
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
    </div>
  );
}
