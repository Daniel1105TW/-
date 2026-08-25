import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDirectory = path.join(process.cwd(), "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(path.join(dataDirectory, "attendance.sqlite"));
database.pragma("journal_mode = WAL");
database.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seat_number INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS attendance (
    student_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '未簽到',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, attendance_date),
    FOREIGN KEY (student_id) REFERENCES students(id)
  );
  CREATE TABLE IF NOT EXISTS contact_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("class_name", "小樹班");
database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("grade", "一年級");
database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("theme", "meadow");
database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run("zhuyin_enabled", "0");

const count = database.prepare("SELECT COUNT(*) AS count FROM students").get() as { count: number };
if (count.count === 0) {
  const seed = database.prepare("INSERT INTO students (seat_number, name) VALUES (?, ?)");
  database.transaction(() => {
    ["王小明", "林小花", "陳品妤", "張恩佑", "李安安", "黃子晴"].forEach((name, index) => seed.run(index + 1, name));
  })();
}

export const db = database;

export type AttendanceStatus = "未簽到" | "簽到" | "請假" | "外務";

export function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
