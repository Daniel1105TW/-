import { pinyin } from "pinyin-pro";

const initials: Record<string, string> = { b: "ㄅ", p: "ㄆ", m: "ㄇ", f: "ㄈ", d: "ㄉ", t: "ㄊ", n: "ㄋ", l: "ㄌ", g: "ㄍ", k: "ㄎ", h: "ㄏ", j: "ㄐ", q: "ㄑ", x: "ㄒ", zh: "ㄓ", ch: "ㄔ", sh: "ㄕ", r: "ㄖ", z: "ㄗ", c: "ㄘ", s: "ㄙ" };
const finals: Record<string, string> = { a: "ㄚ", o: "ㄛ", e: "ㄜ", ê: "ㄝ", ai: "ㄞ", ei: "ㄟ", ao: "ㄠ", ou: "ㄡ", an: "ㄢ", en: "ㄣ", ang: "ㄤ", eng: "ㄥ", er: "ㄦ", i: "ㄧ", ia: "ㄧㄚ", iao: "ㄧㄠ", ie: "ㄧㄝ", iu: "ㄧㄡ", ian: "ㄧㄢ", in: "ㄧㄣ", iang: "ㄧㄤ", ing: "ㄧㄥ", iong: "ㄧㄨㄥ", u: "ㄨ", ua: "ㄨㄚ", uo: "ㄨㄛ", uai: "ㄨㄞ", ui: "ㄨㄟ", uan: "ㄨㄢ", un: "ㄨㄣ", uang: "ㄨㄤ", ong: "ㄨㄥ", ü: "ㄩ", üe: "ㄩㄝ", üan: "ㄩㄢ", ün: "ㄩㄣ" };
const toneMarks: Record<string, { base: string; tone: number }> = { ā: { base: "a", tone: 1 }, á: { base: "a", tone: 2 }, ǎ: { base: "a", tone: 3 }, à: { base: "a", tone: 4 }, ē: { base: "e", tone: 1 }, é: { base: "e", tone: 2 }, ě: { base: "e", tone: 3 }, è: { base: "e", tone: 4 }, ī: { base: "i", tone: 1 }, í: { base: "i", tone: 2 }, ǐ: { base: "i", tone: 3 }, ì: { base: "i", tone: 4 }, ō: { base: "o", tone: 1 }, ó: { base: "o", tone: 2 }, ǒ: { base: "o", tone: 3 }, ò: { base: "o", tone: 4 }, ū: { base: "u", tone: 1 }, ú: { base: "u", tone: 2 }, ǔ: { base: "u", tone: 3 }, ù: { base: "u", tone: 4 }, ǖ: { base: "ü", tone: 1 }, ǘ: { base: "ü", tone: 2 }, ǚ: { base: "ü", tone: 3 }, ǜ: { base: "ü", tone: 4 } };
const specialSyllables: Record<string, string> = { yi: "ㄧ", ya: "ㄧㄚ", ye: "ㄧㄝ", yao: "ㄧㄠ", you: "ㄧㄡ", yan: "ㄧㄢ", yin: "ㄧㄣ", yang: "ㄧㄤ", ying: "ㄧㄥ", yong: "ㄩㄥ", yu: "ㄩ", yue: "ㄩㄝ", yuan: "ㄩㄢ", yun: "ㄩㄣ", wu: "ㄨ", wa: "ㄨㄚ", wo: "ㄨㄛ", wai: "ㄨㄞ", wei: "ㄨㄟ", wan: "ㄨㄢ", wen: "ㄨㄣ", wang: "ㄨㄤ", weng: "ㄨㄥ", zhi: "ㄓ", chi: "ㄔ", shi: "ㄕ", ri: "ㄖ", zi: "ㄗ", ci: "ㄘ", si: "ㄙ" };

function convertSyllable(syllable: string) {
  let tone = 5;
  let base = "";
  for (const character of syllable.toLowerCase()) { const mark = toneMarks[character]; if (mark) { base += mark.base; tone = mark.tone; } else base += character; }
  if (specialSyllables[base]) {
    const toneMark = tone === 2 ? "ˊ" : tone === 3 ? "ˇ" : tone === 4 ? "ˋ" : tone === 5 ? "˙" : "";
    return `${specialSyllables[base]}${toneMark}`;
  }
  if (base.startsWith("yu")) base = `ü${base.slice(2)}`;
  else if (base.startsWith("y")) base = `i${base.slice(1)}`;
  else if (base.startsWith("wu")) base = `u${base.slice(2)}`;
  else if (base.startsWith("w")) base = base.slice(1);
  const initial = Object.keys(initials).sort((a, b) => b.length - a.length).find((key) => base.startsWith(key)) ?? "";
  let finalKey = base.slice(initial.length);
  const normalizedInitial = initial;
  if (finalKey === "iou") finalKey = "iu";
  if (finalKey === "uei") finalKey = "ui";
  if (finalKey === "uen") finalKey = "un";
  if (["j", "q", "x"].includes(normalizedInitial)) {
    finalKey = finalKey.replace(/^u(?=e|an|n|$)/, "ü");
  }
  const final = finals[finalKey];
  if (!final) return syllable;
  const toneMark = tone === 2 ? "ˊ" : tone === 3 ? "ˇ" : tone === 4 ? "ˋ" : tone === 5 ? "˙" : "";
  return `${initials[initial] ?? ""}${final}${toneMark}`;
}

export function withZhuyin(text: string) {
  return pinyin(text, { type: "array", toneType: "symbol" }).map((item, index) => ({ hanzi: [...text][index] ?? item, zhuyin: /^[a-züê]/i.test(item) ? convertSyllable(item) : "" }));
}
