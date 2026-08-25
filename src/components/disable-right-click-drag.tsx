"use client";

import { useEffect } from "react";

// 이미지·화면 무단 캡처/저장을 어렵게 하기 위해 사이트 전역에서 우클릭
// 메뉴와 드래그(이미지·요소 끌기)를 막는다. 단, 입력칸/에디터 안에서는
// 붙여넣기·복사 같은 정상적인 우클릭 메뉴 사용이 막히면 안 되므로
// input·textarea·contenteditable 위에서는 그대로 둔다.
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.closest("input, textarea, [contenteditable='true'], [contenteditable='']") !== null
  );
}

export function DisableRightClickAndDrag() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (!isEditableTarget(e.target)) e.preventDefault();
    };
    const onDragStart = (e: DragEvent) => {
      if (!isEditableTarget(e.target)) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
