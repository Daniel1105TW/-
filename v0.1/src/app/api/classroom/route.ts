import { NextResponse } from "next/server";
import { db, localDate, type AttendanceStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const date = localDate();
  const students = db.prepare(`
    SELECT s.id, s.seat_number AS seatNumber, s.name,
      COALESCE(a.status, '未簽到') AS status
    FROM students s
    LEFT JOIN attendance a ON a.student_id = s.id AND a.attendance_date = ?
    WHERE s.active = 1
    ORDER BY s.seat_number
  `).all(date);
  const contacts = db.prepare(`
    SELECT id, title, content
    FROM contact_entries
    WHERE entry_date = ?
    ORDER BY id DESC
  `).all(date);
  const settings = db.prepare("SELECT key, value FROM settings WHERE key IN ('class_name', 'grade', 'theme', 'zhuyin_enabled')").all() as { key: string; value: string }[];
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  return NextResponse.json({ date, className: values.class_name, grade: values.grade, theme: values.theme, zhuyinEnabled: values.zhuyin_enabled === "1", students, contacts });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { studentId?: number; status?: AttendanceStatus };
  const statuses: AttendanceStatus[] = ["未簽到", "簽到", "請假", "外務"];
  if (!body.studentId || !body.status || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "簽到資料不正確" }, { status: 400 });
  }
  const student = db.prepare("SELECT id FROM students WHERE id = ? AND active = 1").get(body.studentId);
  if (!student) return NextResponse.json({ error: "找不到學生" }, { status: 404 });
  db.prepare(`
    INSERT INTO attendance (student_id, attendance_date, status, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(student_id, attendance_date) DO UPDATE SET
      status = excluded.status, updated_at = CURRENT_TIMESTAMP
  `).run(body.studentId, localDate(), body.status);
  return NextResponse.json({ ok: true });
}
