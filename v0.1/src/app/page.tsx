"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { withZhuyin } from "@/lib/zhuyin";

type Status = "未簽到" | "簽到" | "請假" | "外務";
type Student = { id: number; seatNumber: number; name: string; status: Status };
type Contact = { id: number; title: string; content: string };
type Classroom = { date: string; className: string; grade: string; theme: string; zhuyinEnabled: boolean; students: Student[]; contacts: Contact[] };

const statusOrder: Status[] = ["未簽到", "簽到", "請假", "外務"];
const statusClass: Record<Status, string> = { 未簽到: "status-idle", 簽到: "status-present", 請假: "status-leave", 外務: "status-out" };

function AnnotatedText({ text, enabled }: { text: string; enabled: boolean }) {
  if (!enabled) return <>{text}</>;
  return <>{withZhuyin(text).map((part, index) => <span className="zhuyin-pair" key={`${index}-${part.hanzi}`}><span>{part.hanzi}</span>{part.zhuyin && <small>{part.zhuyin}</small>}</span>)}</>;
}

export default function Home() {
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [error, setError] = useState("");

  async function loadClassroom() {
    const response = await fetch("/api/classroom", { cache: "no-store" });
    if (!response.ok) throw new Error("無法取得班級資料");
    setClassroom(await response.json());
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => loadClassroom().catch(() => setError("目前無法連線，請確認系統伺服器正在執行。")), 0);
    const timer = window.setInterval(() => loadClassroom().catch(() => undefined), 5000);
    return () => { window.clearTimeout(initialLoad); window.clearInterval(timer); };
  }, []);

  async function cycleStatus(student: Student) {
    if (!classroom) return;
    const nextStatus = statusOrder[(statusOrder.indexOf(student.status) + 1) % statusOrder.length];
    setClassroom({ ...classroom, students: classroom.students.map((item) => item.id === student.id ? { ...item, status: nextStatus } : item) });
    const response = await fetch("/api/classroom", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.id, status: nextStatus }) });
    if (!response.ok) { setError("簽到更新失敗，請再試一次。"); await loadClassroom(); }
  }

  const summary = useMemo(() => classroom?.students.reduce((result, student) => { result[student.status] += 1; return result; }, { 未簽到: 0, 簽到: 0, 請假: 0, 外務: 0 } as Record<Status, number>), [classroom]);

  return (
    <main className={`classroom-shell theme-${classroom?.theme ?? "meadow"}`}>
      <header className="topbar"><div><p className="eyebrow">{classroom?.grade ?? "一年級"}｜今日班務</p><h1>{classroom?.className ?? "小樹班"}簽到簿</h1></div><div className="topbar-actions"><span className="date-chip">{classroom?.date ?? "載入中..."}</span><Link className="admin-link" href="/admin">後台管理 <span aria-hidden="true">↗</span></Link></div></header>
      {error && <div className="error-banner" role="alert">{error}</div>}
      <div className="dashboard-grid">
        <section className="attendance-panel" aria-labelledby="attendance-title"><div className="section-heading"><div><p className="section-kicker">01 / ATTENDANCE</p><h2 id="attendance-title">今天來學校</h2></div><div className="summary" aria-label="簽到統計"><span><b>{summary?.簽到 ?? 0}</b> 到校</span><span><b>{summary?.未簽到 ?? 0}</b> 待確認</span></div></div><p className="hint">點一下名字更新狀態</p><div className="student-list">{classroom?.students.map((student) => <button key={student.id} className={`student-row ${statusClass[student.status]}`} onClick={() => cycleStatus(student)}><span className="seat-number">{String(student.seatNumber).padStart(2, "0")}</span><span className="student-name"><AnnotatedText text={student.name} enabled={classroom.zhuyinEnabled} /></span><span className="student-status">{student.status}</span><span className="status-dot" aria-hidden="true" /></button>) ?? <div className="loading">正在載入學生名單...</div>}</div></section>
        <aside className="contact-panel" aria-labelledby="contact-title"><div className="section-heading"><div><p className="section-kicker">02 / NOTEBOOK</p><h2 id="contact-title">今日聯絡簿</h2></div><span className="sun-mark">✳</span></div><div className="contact-list">{classroom?.contacts.length ? classroom.contacts.map((contact) => <article className="contact-entry" key={contact.id}><h3><AnnotatedText text={contact.title} enabled={classroom.zhuyinEnabled} /></h3><p><AnnotatedText text={contact.content} enabled={classroom.zhuyinEnabled} /></p></article>) : <div className="empty-state"><span>○</span><p>今天還沒有聯絡事項</p></div>}</div><div className="contact-footer"><AnnotatedText text="有新的通知，請記得告訴家人" enabled={classroom?.zhuyinEnabled ?? false} /></div></aside>
      </div>
    </main>
  );
}
