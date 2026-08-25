import { NextResponse } from "next/server";
import { db, localDate } from "@/lib/db";
import { checkPassword, hasPassword, isAdmin, setPassword, signIn, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (hasPassword() && !(await isAdmin())) return NextResponse.json({ authenticated: false, needsPassword: true }, { status: 401 });
  const settings = db.prepare("SELECT key, value FROM settings WHERE key IN ('class_name', 'grade', 'theme', 'zhuyin_enabled')").all() as { key: string; value: string }[];
  const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  return NextResponse.json({ authenticated: true, needsPassword: hasPassword(), className: values.class_name, grade: values.grade, theme: values.theme, zhuyinEnabled: values.zhuyin_enabled === "1" });
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: string; password?: string; newPassword?: string };
  if (body.action === "logout") { await signOut(); return NextResponse.json({ ok: true }); }
  if (body.action === "login" && body.password && checkPassword(body.password)) { await signIn(); return NextResponse.json({ ok: true }); }
  if (body.action === "set-password" && body.newPassword && body.newPassword.length >= 4 && (!hasPassword() || await isAdmin())) { setPassword(body.newPassword); await signIn(); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "密碼不正確或格式不符（至少 4 個字元）" }, { status: 401 });
}

export async function PATCH(request: Request) {
  if (hasPassword() && !(await isAdmin())) return NextResponse.json({ error: "請先登入後台" }, { status: 401 });
  const body = await request.json() as { action?: string; seatNumber?: number; name?: string; id?: number; title?: string; content?: string; entryDate?: string; students?: { seatNumber: number; name: string }[]; settings?: { grade?: string; theme?: string; zhuyinEnabled?: boolean } };
  if (body.action === "reset") { db.prepare("DELETE FROM attendance WHERE attendance_date = ?").run(localDate()); return NextResponse.json({ ok: true }); }
  if (body.action === "add-student" && body.seatNumber && body.name?.trim()) {
    const existing = db.prepare("SELECT id, active FROM students WHERE seat_number = ?").get(body.seatNumber) as { id: number; active: number } | undefined;
    try {
      if (existing) db.prepare("UPDATE students SET name = ?, active = 1 WHERE id = ?").run(body.name.trim(), existing.id);
      else db.prepare("INSERT INTO students (seat_number, name) VALUES (?, ?)").run(body.seatNumber, body.name.trim());
    } catch { return NextResponse.json({ error: "新增失敗，這個座號已經存在" }, { status: 400 }); }
    return NextResponse.json({ ok: true });
  }
  if (body.action === "import-students" && body.students?.length) {
    const insert = db.prepare("INSERT INTO students (seat_number, name) VALUES (?, ?)");
    try { db.transaction(() => body.students?.forEach((student) => { const existing = db.prepare("SELECT id FROM students WHERE seat_number = ?").get(student.seatNumber) as { id: number } | undefined; if (existing) db.prepare("UPDATE students SET name = ?, active = 1 WHERE id = ?").run(student.name.trim(), existing.id); else insert.run(student.seatNumber, student.name.trim()); }))(); } catch { return NextResponse.json({ error: "匯入失敗，請確認座號沒有重複且姓名不為空白" }, { status: 400 }); }
    return NextResponse.json({ ok: true });
  }
  if (body.action === "set-class-name" && body.name?.trim()) { db.prepare("UPDATE settings SET value = ? WHERE key = 'class_name'").run(body.name.trim()); return NextResponse.json({ ok: true }); }
  if (body.action === "set-display-settings") {
    const settings = body.settings as { grade?: string; theme?: string; zhuyinEnabled?: boolean } | undefined;
    const themes = ["meadow", "sunrise", "sky"];
    const grades = ["一年級", "二年級", "三年級", "四年級", "五年級", "六年級"];
    if (!settings || !settings.grade || !grades.includes(settings.grade) || !settings.theme || !themes.includes(settings.theme) || typeof settings.zhuyinEnabled !== "boolean") return NextResponse.json({ error: "顯示設定不正確" }, { status: 400 });
    db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(settings.grade, "grade"); db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(settings.theme, "theme"); db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(settings.zhuyinEnabled ? "1" : "0", "zhuyin_enabled"); return NextResponse.json({ ok: true });
  }
  if (body.action === "delete-student" && body.id) { db.prepare("UPDATE students SET active = 0 WHERE id = ?").run(body.id); return NextResponse.json({ ok: true }); }
  if (body.action === "add-contact" && body.title?.trim() && body.content?.trim()) { db.prepare("INSERT INTO contact_entries (entry_date, title, content) VALUES (?, ?, ?)").run(body.entryDate || localDate(), body.title.trim(), body.content.trim()); return NextResponse.json({ ok: true }); }
  if (body.action === "delete-contact" && body.id) { db.prepare("DELETE FROM contact_entries WHERE id = ?").run(body.id); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "資料格式不正確" }, { status: 400 });
}
