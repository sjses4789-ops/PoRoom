// 라우트 전환 시 데이터가 다 준비될 때까지 빈 화면으로 멈춰있지 않도록,
// Next.js가 즉시 보여주는 loading.tsx들이 공용으로 쓰는 스피너.
export function PageSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500 dark:border-neutral-700 dark:border-t-neutral-400" />
    </div>
  );
}
