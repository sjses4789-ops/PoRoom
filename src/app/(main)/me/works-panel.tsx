"use client";

import { useState } from "react";
import { WorkChart, type WorkMeta, type WorkRecordPoint } from "./work-chart";

export function WorksPanel({
  works,
  records,
}: {
  works: WorkMeta[];
  records: WorkRecordPoint[];
}) {
  const [workRecords, setWorkRecords] = useState<WorkRecordPoint[]>(records);

  return (
    <div className="rounded-md border border-neutral-400 p-4 dark:border-neutral-600">
      <WorkChart works={works} records={workRecords} onRecordsChange={setWorkRecords} />
    </div>
  );
}
