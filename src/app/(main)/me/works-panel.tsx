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
  const [workRecords, setWorkRecords] = useState<WorkRecordPoint[]>(records);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 divide-y divide-neutral-400 overflow-hidden rounded-md border border-neutral-400 dark:divide-neutral-600 dark:border-neutral-600 lg:grid-cols-[2fr_1fr] lg:divide-x lg:divide-y-0">
      <div className="p-4">
        <WorkChart
          works={works}
          records={workRecords}
          entries={entries}
          selectedId={selectedId}
          onRecordsChange={setWorkRecords}
        />
      </div>
      <div className="p-4">
        <WorkList works={works} onWorksChange={setWorks} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </div>
  );
}
