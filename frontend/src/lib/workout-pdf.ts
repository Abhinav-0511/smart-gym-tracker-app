import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { DailyCheckin } from "@/types/checkin";
import type { WorkoutSession } from "@/types/workout-session";

function slugify(title: string): string {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function checkinRows(checkin: DailyCheckin): [string, string][] {
  const rows: Array<[string, string] | null> = [
    checkin.weightKg !== null ? ["Weight", `${checkin.weightKg} kg`] : null,
    checkin.waistCm !== null ? ["Waist", `${checkin.waistCm} cm`] : null,
    checkin.sleepHours !== null ? ["Sleep", `${checkin.sleepHours} h`] : null,
    checkin.steps !== null ? ["Steps", String(checkin.steps)] : null,
    checkin.calories !== null ? ["Calories", String(checkin.calories)] : null,
    checkin.proteinG !== null ? ["Protein", `${checkin.proteinG} g`] : null,
    checkin.waterLiters !== null ? ["Water", `${checkin.waterLiters} L`] : null,
    checkin.energy !== null ? ["Energy", `${checkin.energy}/10`] : null,
    checkin.mood !== null ? ["Mood", `${checkin.mood}/10`] : null,
    checkin.notes ? ["Notes", checkin.notes] : null,
  ];
  return rows.filter((row): row is [string, string] => row !== null);
}

/** Where jspdf-autotable leaves the cursor after the most recent table it drew. */
function lastTableEndY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 30;
}

/**
 * Builds and downloads a one-page PDF summary of a completed workout session —
 * exercises/sets/reps/weight/RIR, plus that day's Daily Check-in details when
 * one was filled in (check-in now lives inline on the workout page, not its
 * own page, so this is the only place check-in data gets exported).
 */
export function exportWorkoutPdf(session: WorkoutSession, checkin?: DailyCheckin | null): void {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(session.title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Date: ${session.workoutDate}`, 14, 25);

  let notesEndY = 25;
  if (session.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${session.notes}`, 180);
    doc.text(wrapped, 14, 31);
    notesEndY = 31 + (wrapped.length - 1) * 4.5;
  }

  const setRows = session.exercises.flatMap((exercise) =>
    exercise.sets.map((set) => [
      exercise.name,
      String(set.setNumber),
      set.setType === "warmup" ? "Warm-up" : "Working",
      set.reps === null ? "—" : String(set.reps),
      set.weightKg === null ? "—" : String(set.weightKg),
      set.rir === null ? "—" : String(set.rir),
      set.isCompleted ? "Yes" : "No",
    ]),
  );

  autoTable(doc, {
    startY: notesEndY + 7,
    head: [["Exercise", "Set", "Type", "Reps", "Weight (kg)", "RIR", "Completed"]],
    body: setRows,
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 32, 36] },
    alternateRowStyles: { fillColor: [245, 245, 247] },
  });

  const rows = checkin ? checkinRows(checkin) : [];
  if (rows.length) {
    const checkinStartY = lastTableEndY(doc) + 10;
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text("Daily Check-in", 14, checkinStartY);

    autoTable(doc, {
      startY: checkinStartY + 4,
      head: [["Field", "Value"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 32, 36] },
      alternateRowStyles: { fillColor: [245, 245, 247] },
      columnStyles: { 0: { cellWidth: 40 } },
    });
  }

  doc.save(`workout-${session.workoutDate}${slugify(session.title) ? `-${slugify(session.title)}` : ""}.pdf`);
}
