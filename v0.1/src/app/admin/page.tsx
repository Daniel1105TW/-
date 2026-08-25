"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";

type Student = { id: number; seatNumber: number; name: string };
type Contact = { id: number; title: string; content: string };
type ImportStudent = { seatNumber: number; name: string };

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [className, setClassName] = useState("");
  const [grade, setGrade] = useState("一年級");
  const [theme, setTheme] = useState("meadow");
  const [zhuyinEnabled, setZhuyinEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [preview, setPreview] = useState<ImportStudent[]>([]);
  const [seat, setSeat] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function refresh() {
    const auth = await fetch("/api/admin"); const result = await auth.json();
    setAuthenticated(result.authenticated); setNeedsPassword(result.needsPassword); setClassName(result.className || "小樹班"); setGrade(result.grade || "一年級"); setTheme(result.theme || "meadow"); setZhuyinEnabled(result.zhuyinEnabled === true);
    if (result.authenticated) { const data = await fetch("/api/classroom").then((response) => response.json()); setStudents(data.students); setContacts(data.contacts); }
  }
  useEffect(() => { const initialLoad = window.setTimeout(() => refresh().catch(() => setMessage("無法連線")), 0); return () => window.clearTimeout(initialLoad); }, []);
  async function send(action: string, extra: Record<string, unknown> = {}) { const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) }); if (!response.ok) { setMessage((await response.json()).error || "操作失敗"); return false; } await refresh(); setMessage("已更新"); return true; }
  async function submitAuth(event: FormEvent) { event.preventDefault(); const action = needsPassword ? "login" : "set-password"; const body = action === "login" ? { action, password } : { action, newPassword }; const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) { setMessage((await response.json()).error); return; } setPassword(""); setNewPassword(""); await refresh(); }
  async function readExcel(file: File) { const workbook = XLSX.read(await file.arrayBuffer()); const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]); const imported = rows.map((row) => ({ seatNumber: Number(row["座號"] ?? row["座次"] ?? row["seatNumber"]), name: String(row["姓名"] ?? row["name"] ?? "").trim() })).filter((item) => Number.isInteger(item.seatNumber) && item.seatNumber > 0 && item.name); setPreview(imported); setMessage(imported.length ? `已讀取 ${imported.length} 位學生，請確認後匯入` : "找不到有效的座號與姓名欄位"); }

  if (authenticated === null) return <main className="admin-shell"><p>載入後台...</p></main>;
  if (!authenticated) return <main className="admin-shell"><Link className="back-link" href="/">← 回到學生端</Link><div className="admin-auth"><p className="section-kicker">TEACHER ACCESS</p><h1>{needsPassword ? "後台登入" : "設定後台密碼"}</h1><p>{needsPassword ? "請輸入教師密碼" : "第一次使用，請設定至少 4 個字元的密碼"}</p><form onSubmit={submitAuth}><input type="password" value={needsPassword ? password : newPassword} onChange={(event) => needsPassword ? setPassword(event.target.value) : setNewPassword(event.target.value)} placeholder="密碼" autoFocus /><button type="submit">{needsPassword ? "登入" : "設定並進入"}</button></form>{message && <p className="form-message">{message}</p>}</div></main>;

  return <main className="admin-shell"><header className="admin-header"><div><Link className="back-link" href="/">← 學生端</Link><p className="section-kicker">TEACHER CONTROL ROOM</p><h1>班級後台</h1></div><button className="secondary-button" onClick={() => fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }).then(() => refresh())}>登出</button></header>{message && <p className="form-message">{message}</p>}
    <section className="admin-section"><div className="admin-section-title"><div><p className="section-kicker">DISPLAY</p><h2>畫面設定</h2></div></div><form className="settings-form" onSubmit={(event) => { event.preventDefault(); send("set-display-settings", { settings: { grade, theme, zhuyinEnabled } }); }}><label>年級<select value={grade} onChange={(event) => setGrade(event.target.value)}><option>一年級</option><option>二年級</option><option>三年級</option><option>四年級</option><option>五年級</option><option>六年級</option></select></label><label>配色主題<select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="meadow">草地清新</option><option value="sunrise">暖陽橘紅</option><option value="sky">天空藍綠</option></select></label><label className="toggle-label"><input type="checkbox" checked={zhuyinEnabled} onChange={(event) => setZhuyinEnabled(event.target.checked)} />啟用注音</label><button type="submit">儲存畫面設定</button></form></section>
    <section className="admin-section"><div className="admin-section-title"><div><p className="section-kicker">CLASS</p><h2>班級名稱</h2></div></div><form className="inline-form" onSubmit={(event) => { event.preventDefault(); send("set-class-name", { name: className }); }}><input value={className} onChange={(event) => setClassName(event.target.value)} placeholder="班級名稱" /><button type="submit">儲存名稱</button></form></section>
    <section className="admin-section"><div className="admin-section-title"><div><p className="section-kicker">STUDENTS</p><h2>學生名單</h2></div><button className="danger-button" onClick={() => window.confirm("確定要清除今天所有簽到狀態嗎？") && send("reset")}>重置今日簽到</button></div><form className="inline-form" onSubmit={(event) => { event.preventDefault(); send("add-student", { seatNumber: Number(seat), name }).then((ok) => { if (ok) { setSeat(""); setName(""); } }); }}><input value={seat} onChange={(event) => setSeat(event.target.value)} placeholder="座號" type="number" min="1" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="學生姓名" /><button type="submit">新增學生</button></form><label className="file-import">匯入 Excel 名單<input type="file" accept=".xlsx,.xls" onChange={(event) => event.target.files?.[0] && readExcel(event.target.files[0])} /></label>{preview.length > 0 && <div className="import-preview"><p>預覽：{preview.map((item) => `${item.seatNumber}. ${item.name}`).join("、")}</p><button onClick={() => send("import-students", { students: preview }).then((ok) => ok && setPreview([]))}>確認匯入</button></div>}<div className="admin-list">{students.map((student) => <div className="admin-row" key={student.id}><span>{student.seatNumber}</span><b>{student.name}</b><button onClick={() => send("delete-student", { id: student.id })}>停用</button></div>)}</div></section>
    <section className="admin-section"><div className="admin-section-title"><div><p className="section-kicker">NOTEBOOK</p><h2>聯絡簿</h2></div></div><form className="contact-form" onSubmit={(event) => { event.preventDefault(); send("add-contact", { title, content }).then((ok) => { if (ok) { setTitle(""); setContent(""); } }); }}><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="標題，例如：今日提醒" /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="聯絡事項內容" rows={3} /><button type="submit">新增聯絡簿</button></form><div className="admin-list">{contacts.map((contact) => <div className="admin-row contact-admin-row" key={contact.id}><div><b>{contact.title}</b><p>{contact.content}</p></div><button onClick={() => send("delete-contact", { id: contact.id })}>刪除</button></div>)}</div></section>
    <section className="admin-section password-section"><p className="section-kicker">SECURITY</p><h2>修改後台密碼</h2><form className="inline-form" onSubmit={(event) => { event.preventDefault(); fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set-password", newPassword }) }).then(() => refresh()); }}><input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="新密碼" /><button type="submit">更新密碼</button></form></section>
  </main>;
}
