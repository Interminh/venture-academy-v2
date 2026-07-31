"use client";

import { useState } from "react";
import { StudentCard } from "./StudentCard";
import { SlotAgenda, type AgendaItem } from "@/components/slots/SlotAgenda";
import { ClaimButton } from "@/components/slots/ClaimButton";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { gradeLabel } from "@/lib/utils/slots";
import type { Weekday } from "@/lib/types/database";
import type { SlotStatus } from "@/components/slots/StatusTrack";

export interface StudentSummary {
  id: string;
  firstName: string;
  grade: number;
  maxWeeklySessions: number | null;
  subjects: { id: string; name: string }[];
  slots: { slotId: string; day: Weekday; startTime: string; status: SlotStatus }[];
}

export function TutorRosterGrid({ students }: { students: StudentSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (students.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-body">
        No students match these filters yet.
      </p>
    );
  }

  const selected = students.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {students.map((student) => {
          const bookedCount = student.slots.filter((s) => s.status === "booked").length;
          const isFullyBooked =
            student.maxWeeklySessions !== null && bookedCount >= student.maxWeeklySessions;
          return (
            <StudentCard
              key={student.id}
              firstName={student.firstName}
              grade={student.grade}
              subjectNames={student.subjects.map((s) => s.name)}
              openCount={student.slots.filter((s) => s.status === "open").length}
              isFullyBooked={isFullyBooked}
              isSelected={student.id === selectedId}
              onClick={() => setSelectedId(student.id === selectedId ? null : student.id)}
            />
          );
        })}
      </div>

      {selected && (
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-ink">
                  {selected.firstName}&apos;s schedule
                </h2>
                {selected.maxWeeklySessions !== null &&
                  selected.slots.filter((s) => s.status === "booked").length >=
                    selected.maxWeeklySessions && <Badge tone="info">Fully booked</Badge>}
              </div>
              <p className="text-sm text-body">
                {gradeLabel(selected.grade)} · needs {selected.subjects.map((s) => s.name).join(", ")}
              </p>
            </div>
          </div>
          <SlotAgenda
            items={selected.slots.map(
              (slot): AgendaItem => ({
                id: slot.slotId,
                day: slot.day,
                startTime: slot.startTime,
                status: slot.status,
                actions:
                  slot.status === "open" ? (
                    <ClaimButton slotId={slot.slotId} subjects={selected.subjects} />
                  ) : undefined,
              })
            )}
            emptyMessage="No availability added yet."
          />
        </Card>
      )}
    </div>
  );
}
