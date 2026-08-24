"use client";

import { useState } from "react";
import { WorkChart, type WorkMeta, type WorkRecordPoint, type WorkEntryPoint } from "./work-chart";
import { WorkList } from "./work-list";

export function WorksPanel({
  works: initialWorks,
  records,
  entries,
}: {
  works: WorkMeta[];
  records: WorkRecordPoint[];
  entries: WorkEntryPoint[];
}) {
  const [works, setWorks] = useState<WorkMeta[]>(initialWorks);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="border border-neutral-400 p-4 dark:border-neutral-600">
        <WorkChart works={works} records={records} entries={entries} />
      </div>
      <div className="border border-neutral-400 p-4 dark:border-neutral-600">
        <WorkList works={works} onWorksChange={setWorks} />
      </div>
    </div>
  );
}
