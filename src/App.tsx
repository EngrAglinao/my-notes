import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  preacher?: string;
  verse?: string;
  audioLink?: string;
  slideLink?: string;
}

interface BibleVerseResult {
  book: string;
  chapter: number;
  verses: Array<{ verse: number; text: string }>;
  ref: string;
}

type TabType = "calendar" | "notes" | "bible" | "settings";

// ── Bible Data (inline core for offline support) ───────
const BIBLE_ESV: Record<string, Record<number, Record<number, string>>> = {
  John: {
    3: { 16: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.", 17: "For God did not send his Son into the world to condemn the world, but in order that the world might be saved through him." },
    14: { 6: "Jesus said to him, \"I am the way, and the truth, and the life. No one comes to the Father except through me.\"", 27: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid." },
    15: { 5: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing." }
  },
  Psalms: {
    23: { 1: "The LORD is my shepherd; I shall not want.", 2: "He makes me lie down in green pastures. He leads me beside still waters.", 3: "He restores my soul. He leads me in paths of righteousness for his name's sake.", 4: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.", 5: "You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows.", 6: "Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the LORD forever." },
    46: { 10: "Be still, and know that I am God. I will be exalted among the nations, I will be exalted in the earth!" },
    119: { 105: "Your word is a lamp to my feet and a light to my path." }
  },
  Romans: {
    8: { 28: "And we know that for those who love God all things work together for good, for those who are called according to his purpose.", 38: "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers,", 39: "nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord." },
    12: { 2: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect." }
  },
  Philippians: {
    4: { 6: "do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.", 7: "And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.", 13: "I can do all things through him who strengthens me.", 19: "And my God will supply every need of yours according to his riches in glory in Christ Jesus." }
  },
  Jeremiah: { 29: { 11: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope." } },
  Isaiah: { 40: { 31: "but they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint." } },
  Proverbs: { 3: { 5: "Trust in the LORD with all your heart, and do not lean on your own understanding.", 6: "In all your ways acknowledge him, and he will make straight your paths." } },
  Hebrews: { 11: { 1: "Now faith is the assurance of things hoped for, the conviction of things not seen." } },
  Galatians: { 5: { 22: "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness,", 23: "gentleness, self-control; against such things there is no law." } },
  Matthew: { 6: { 33: "But seek first the kingdom of God and his righteousness, and all these things will be added to you." } },
};

const BIBLE_NIV: Record<string, Record<number, Record<number, string>>> = {
  John: {
    3: { 16: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", 17: "For God did not send his Son into the world to condemn the world, but to save the world through him." },
    14: { 6: "Jesus answered, \"I am the way and the truth and the life. No one comes to the Father except through me.\"", 27: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid." }
  },
  Psalms: {
    23: { 1: "The Lord is my shepherd, I lack nothing.", 2: "He makes me lie down in green pastures, he leads me beside quiet waters,", 3: "he refreshes my soul. He guides me along the right paths for his name's sake.", 4: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.", 5: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows.", 6: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever." },
    46: { 10: "He says, \"Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.\"" }
  },
  Romans: {
    8: { 28: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", 38: "For I am convinced that neither death nor life, neither angels nor demons, neither the present nor the future, nor any powers,", 39: "neither height nor depth, nor anything else in all creation, will be able to separate us from the love of God that is in Christ Jesus our Lord." }
  },
  Philippians: { 4: { 13: "I can do all this through him who gives me strength.", 6: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", 7: "And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." } },
  Jeremiah: { 29: { 11: "For I know the plans I have for you,\" declares the Lord, \"plans to prosper you and not to harm you, plans to give you hope and a future." } },
  Proverbs: { 3: { 5: "Trust in the Lord with all your heart and lean not on your own understanding;", 6: "in all your ways submit to him, and he will make your paths straight." } },
  Hebrews: { 11: { 1: "Now faith is confidence in what we hope for and assurance about what we do not see." } },
};

const BOOK_ALIASES: Record<string, string> = {
  gen: "Genesis", genesis: "Genesis", ex: "Exodus", exodus: "Exodus", lev: "Leviticus",
  num: "Numbers", deut: "Deuteronomy", josh: "Joshua", judg: "Judges", ruth: "Ruth",
  ps: "Psalms", psa: "Psalms", psalm: "Psalms", psalms: "Psalms",
  prov: "Proverbs", proverbs: "Proverbs", pro: "Proverbs", pr: "Proverbs",
  eccl: "Ecclesiastes", isa: "Isaiah", is: "Isaiah", isaiah: "Isaiah",
  jer: "Jeremiah", jeremiah: "Jeremiah",
  matt: "Matthew", mat: "Matthew", mt: "Matthew", matthew: "Matthew",
  mark: "Mark", mk: "Mark", luke: "Luke", lk: "Luke",
  john: "John", jn: "John", joh: "John",
  acts: "Acts", rom: "Romans", ro: "Romans", romans: "Romans",
  "1cor": "1 Corinthians", "1co": "1 Corinthians",
  "2cor": "2 Corinthians", "2co": "2 Corinthians",
  gal: "Galatians", galatians: "Galatians",
  eph: "Ephesians", ephesians: "Ephesians",
  phil: "Philippians", php: "Philippians", philippians: "Philippians",
  col: "Colossians", "1thess": "1 Thessalonians", "2thess": "2 Thessalonians",
  "1tim": "1 Timothy", "2tim": "2 Timothy", titus: "Titus",
  heb: "Hebrews", hebrews: "Hebrews", jas: "James", james: "James",
  "1pet": "1 Peter", "2pet": "2 Peter",
  "1john": "1 John", "2john": "2 John", "3john": "3 John",
  jude: "Jude", rev: "Revelation", revelation: "Revelation", re: "Revelation",
};

function lookupBible(ref: string, translation: "ESV" | "NIV"): BibleVerseResult | null {
  const data = translation === "ESV" ? BIBLE_ESV : BIBLE_NIV;
  const cleaned = ref.trim();
  const match = cleaned.match(/^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
  if (!match) return null;
  let [, bookRaw, chapterStr, verseStartStr, verseEndStr] = match;
  bookRaw = bookRaw.trim().toLowerCase().replace(/\s+/g, "");
  const chapter = parseInt(chapterStr);
  const verseStart = verseStartStr ? parseInt(verseStartStr) : null;
  const verseEnd = verseEndStr ? parseInt(verseEndStr) : null;

  let bookName = BOOK_ALIASES[bookRaw];
  if (!bookName) {
    for (const [key, val] of Object.entries(BOOK_ALIASES)) {
      if (val.toLowerCase().replace(/\s/g, "") === bookRaw || key.startsWith(bookRaw)) {
        bookName = val;
        break;
      }
    }
  }
  if (!bookName || !data[bookName]) return null;
  const bookData = data[bookName];
  if (!bookData[chapter]) return null;
  const chapterData = bookData[chapter];

  if (!verseStart) {
    const verses = Object.entries(chapterData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([v, t]) => ({ verse: parseInt(v), text: t }));
    return { book: bookName, chapter, verses, ref: `${bookName} ${chapter}` };
  }

  const verses: Array<{ verse: number; text: string }> = [];
  const end = verseEnd || verseStart;
  for (let v = verseStart; v <= end; v++) {
    if (chapterData[v]) verses.push({ verse: v, text: chapterData[v] });
  }
  if (verses.length === 0) return null;
  return { book: bookName, chapter, verses, ref: `${bookName} ${chapter}:${verseStart}${verseEnd ? `-${verseEnd}` : ""}` };
}

// ── Firebase Mock (real config injected at runtime) ────
declare const __FIREBASE_CONFIG__: string;
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT_MONTHS = MONTHS.map(m => m.slice(0, 3));

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

// ── IndexedDB ──────────────────────────────────────────
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("VistaWorshipDB", 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("fileHandles"))
        db.createObjectStore("fileHandles", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToIDB(handle: FileSystemDirectoryHandle) {
  const db = await openIDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction("fileHandles", "readwrite");
    tx.objectStore("fileHandles").put({ id: "noteFolder", handle });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB();
    return new Promise((res) => {
      const tx = db.transaction("fileHandles", "readonly");
      const req = tx.objectStore("fileHandles").get("noteFolder");
      req.onsuccess = () => res((req.result?.handle as FileSystemDirectoryHandle) || null);
      req.onerror = () => res(null);
    });
  } catch { return null; }
}

// ── Snackbar ───────────────────────────────────────────
function Snackbar({ message, icon, onHide }: { message: string; icon: string; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 3000);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <div style={{
      position: "fixed", bottom: "96px", left: "50%", transform: "translateX(-50%)",
      background: "var(--md-sys-color-inverse-surface)", color: "var(--md-sys-color-inverse-on-surface)",
      padding: "12px 16px", borderRadius: "4px", fontSize: "14px", zIndex: 300,
      display: "flex", alignItems: "center", gap: "8px", boxShadow: "var(--md-sys-elevation-3)",
      whiteSpace: "nowrap", maxWidth: "calc(100vw - 32px)", animation: "snack-in 0.2s ease"
    }}>
      <span className="material-symbols-rounded icon-filled" style={{ fontSize: "18px" }}>{icon}</span>
      {message}
    </div>
  );
}

// ── Bible Modal ────────────────────────────────────────
function BibleModal({ ref: verseRef, onClose }: { ref: string; onClose: () => void }) {
  const [trans, setTrans] = useState<"ESV" | "NIV">("ESV");
  const result = lookupBible(verseRef, trans);

  const copyVerse = () => {
    if (!result) return;
    const text = result.verses.map(v => `${v.verse} ${v.text}`).join("\n");
    navigator.clipboard.writeText(`${result.ref} (${trans})\n${text}`).catch(() => {});
  };

  return (
    <div className="dialog-scrim" onClick={onClose} style={{ zIndex: 400 }}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-icon">
          <span className="material-symbols-rounded icon-filled" style={{ fontSize: "36px", color: "var(--md-sys-color-primary)" }}>menu_book</span>
        </div>
        <div style={{ fontSize: "18px", fontWeight: 500, color: "var(--md-sys-color-on-surface)", marginBottom: "12px", textAlign: "center" }}>{verseRef}</div>
        <div className="translation-toggle" style={{ marginBottom: "16px" }}>
          {(["ESV","NIV"] as const).map(t => (
            <button key={t} className={`translation-btn${trans === t ? " active" : ""}`} onClick={() => setTrans(t)}>{t}</button>
          ))}
        </div>
        <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {result ? result.verses.map(v => (
            <div key={v.verse} style={{ padding: "8px 0", borderBottom: "1px solid var(--md-sys-color-outline-variant)", fontSize: "15px", lineHeight: 1.6, color: "var(--md-sys-color-on-surface)" }}>
              <sup style={{ fontSize: "11px", fontWeight: 700, color: "var(--md-sys-color-primary)", marginRight: "4px" }}>{v.verse}</sup>
              {v.text}
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "16px", color: "var(--md-sys-color-on-surface-variant)", fontSize: "14px" }}>
              Verse not found in offline database.
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
          <button className="btn-text" onClick={onClose}>Close</button>
          <button className="btn-tonal" onClick={copyVerse} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>content_copy</span>
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rich Text Editor ───────────────────────────────────
function RichEditor({ filename, initialContent, folderHandle, onSaved }: {
  filename: string;
  initialContent: string;
  folderHandle: FileSystemDirectoryHandle | null;
  onSaved?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  const [openVerseModal, setOpenVerseModal] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saveTimer = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent || "";
    }
  }, [initialContent]);

  const execCmd = (cmd: string, value?: string) => {
    if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, value);
    }
    editorRef.current?.focus();
  };

  const autoSave = useCallback(async () => {
    if (!folderHandle || !editorRef.current) return;
    try {
      const fh = await folderHandle.getFileHandle(filename, { create: true });
      const w = await fh.createWritable();
      await w.write(editorRef.current.innerHTML);
      await w.close();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (e) { console.error("Save error:", e); }
  }, [folderHandle, filename, onSaved]);

  const handleInput = () => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(autoSave, 800);
  };

  const insertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.execCommand("insertImage", false, ev.target?.result as string);
      handleInput();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toolbarBtns = [
    { label: <b>B</b>, cmd: "bold" },
    { label: <i>I</i>, cmd: "italic" },
    { label: "H1", cmd: "formatBlock", val: "h1" },
    { label: "H2", cmd: "formatBlock", val: "h2" },
    { label: "H3", cmd: "formatBlock", val: "h3" },
    { label: "¶", cmd: "formatBlock", val: "p" },
    { label: <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>format_list_bulleted</span>, cmd: "insertUnorderedList" },
    { label: <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>link</span>, cmd: "createLink" },
  ];

  const imgInputId = `img-${filename.replace(/[^a-z0-9]/gi, "_")}`;

  return (
    <div style={{ marginTop: "4px", marginBottom: "16px" }}>
      <div className="editor-toolbar">
        {toolbarBtns.map((btn, i) => (
          <button key={i} className="toolbar-btn"
            onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val); }}>
            {btn.label}
          </button>
        ))}
        <label htmlFor={imgInputId} className="toolbar-btn" style={{ cursor: "pointer" }}>
          <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>image</span>
        </label>
        <input id={imgInputId} type="file" accept="image/*" style={{ display: "none" }} onChange={insertImage} />
      </div>
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing your notes here… Bible references like 'John 3:16' become clickable links."
        onInput={handleInput}
        style={{ minHeight: "180px" }}
      />
      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--md-sys-color-on-surface-variant)", padding: "6px 0" }}>
          <span className="material-symbols-rounded icon-filled" style={{ fontSize: "14px", color: "#4CAF50" }}>check_circle</span>
          Saved to device folder
        </div>
      )}
      {openVerseModal && <BibleModal ref={openVerseModal} onClose={() => setOpenVerseModal(null)} />}
    </div>
  );
}

// ── Calendar ───────────────────────────────────────────
function Calendar({ year, month, selectedDate, events, onSelectDate, onChangeMonth }: {
  year: number; month: number; selectedDate: string | null;
  events: Record<string, CalendarEvent>;
  onSelectDate: (d: string) => void;
  onChangeMonth: (delta: number) => void;
}) {
  const touchStart = useRef(0);
  const touchStartY = useRef(0);

  const today = new Date();
  const todayStr = toDateStr(today);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{ dateStr: string; day: number; isOther: boolean }> = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    days.push({ dateStr: toDateStr(new Date(year, month - 1, d)), day: d, isOther: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ dateStr: toDateStr(new Date(year, month, d)), day: d, isOther: false });
  }
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  let nd = 1;
  while (days.length < totalCells) {
    days.push({ dateStr: toDateStr(new Date(year, month + 1, nd)), day: nd++, isOther: true });
  }

  return (
    <div
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStart.current;
        const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
        if (Math.abs(dx) > 50 && dy < 60) onChangeMonth(dx < 0 ? 1 : -1);
      }}
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", padding: "8px 8px 4px" }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="calendar-day-header">{d}</div>
        ))}
      </div>
      <div className="calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", padding: "0 8px 8px" }}>
        {days.map(({ dateStr, day, isOther }) => {
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasEvent = !!events[dateStr];
          let cls = "calendar-day";
          if (isOther) cls += " other-month";
          if (isToday && !isSelected) cls += " today";
          if (isSelected) cls += " selected";
          if (hasEvent) cls += " has-event";
          return (
            <div key={dateStr} className={cls} onClick={() => onSelectDate(dateStr)}>{day}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Month Picker Dialog ────────────────────────────────
function MonthPickerDialog({ currentYear, currentMonth, onSelect, onClose }: {
  currentYear: number; currentMonth: number;
  onSelect: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState<number>(currentYear);
  return (
    <div className="dialog-scrim" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="dialog" style={{ maxWidth: "340px" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: "20px", fontWeight: 500, marginBottom: "16px", textAlign: "center" }}>Jump to Month</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <button className="icon-btn" onClick={() => setPickerYear(y => y - 1)}>
            <span className="material-symbols-rounded">chevron_left</span>
          </button>
          <span style={{ fontSize: "18px", fontWeight: 500 }}>{pickerYear}</span>
          <button className="icon-btn" onClick={() => setPickerYear(y => y + 1)}>
            <span className="material-symbols-rounded">chevron_right</span>
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
          {SHORT_MONTHS.map((m, i) => {
            const isCurrent = i === currentMonth && pickerYear === currentYear;
            return (
              <button key={i}
                style={{ padding: "10px 8px", border: `1px solid ${isCurrent ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)"}`, borderRadius: "999px", background: isCurrent ? "var(--md-sys-color-primary-container)" : "transparent", color: isCurrent ? "var(--md-sys-color-on-primary-container)" : "var(--md-sys-color-on-surface)", fontFamily: "'Google Sans',sans-serif", fontSize: "13px", fontWeight: 500, cursor: "pointer", textAlign: "center" }}
                onClick={() => { onSelect(pickerYear, i); onClose(); }}
              >{m}</button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button className="btn-text" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────
function DetailPanel({ dateStr, event, folderHandle, onVerseClick, onNotesSaved }: {
  dateStr: string;
  event: CalendarEvent | null;
  folderHandle: FileSystemDirectoryHandle | null;
  onVerseClick: (ref: string) => void;
  onNotesSaved: () => void;
}) {
  const [noteContent, setNoteContent] = useState("");
  const filename = `${dateStr}_general.html`;

  useEffect(() => {
    if (!folderHandle) { setNoteContent(""); return; }
    (async () => {
      try {
        const fh = await folderHandle.getFileHandle(filename);
        const f = await fh.getFile();
        const text = await f.text();
        setNoteContent(text);
      } catch { setNoteContent(""); }
    })();
  }, [dateStr, folderHandle, filename]);

  const displayDate = (() => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } catch { return dateStr; }
  })();

  const convertDriveLink = (url?: string) => {
    if (!url) return "";
    const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    return url;
  };

  if (!event) {
    return (
      <div style={{ margin: "0 8px 8px", borderRadius: "var(--md-sys-shape-corner-large)", background: "var(--md-sys-color-surface-container-low)", border: "1px solid var(--md-sys-color-outline-variant)", overflow: "hidden" }}>
        <div style={{ padding: "16px", background: "var(--md-sys-color-surface-container)", borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--md-sys-color-primary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{displayDate}</div>
          <div style={{ fontSize: "16px", color: "var(--md-sys-color-on-surface-variant)", marginTop: "4px" }}>No Service Scheduled</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px", background: "var(--md-sys-color-tertiary-container)", color: "var(--md-sys-color-on-tertiary-container)", margin: "12px", borderRadius: "var(--md-sys-shape-corner-medium)", fontSize: "13px", lineHeight: 1.5 }}>
          <span className="material-symbols-rounded icon-filled" style={{ flexShrink: 0 }}>auto_stories</span>
          No media uploaded for this date yet. Feel free to use this space for personal journaling!
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>Personal Notes</div>
          <RichEditor filename={filename} initialContent={noteContent} folderHandle={folderHandle} onSaved={onNotesSaved} />
        </div>
      </div>
    );
  }

  const audioUrl = convertDriveLink(event.audioLink);

  return (
    <div style={{ margin: "0 8px 8px", borderRadius: "var(--md-sys-shape-corner-large)", background: "var(--md-sys-color-surface-container-low)", border: "1px solid var(--md-sys-color-outline-variant)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px", background: "var(--md-sys-color-surface-container)", borderBottom: "1px solid var(--md-sys-color-outline-variant)" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--md-sys-color-primary)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{displayDate}</div>
        <div style={{ fontSize: "20px", fontWeight: 500, color: "var(--md-sys-color-on-surface)", margin: "4px 0 2px" }}>{event.title}</div>
        {event.preacher && (
          <div style={{ fontSize: "14px", color: "var(--md-sys-color-on-surface-variant)", display: "flex", alignItems: "center", gap: "4px" }}>
            <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>person</span>
            {event.preacher}
          </div>
        )}
        {event.verse && (
          <button onClick={() => onVerseClick(event.verse!)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "8px", padding: "6px 12px", background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", borderRadius: "999px", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer" }}>
            <span className="material-symbols-rounded icon-filled" style={{ fontSize: "16px" }}>menu_book</span>
            {event.verse}
          </button>
        )}
      </div>

      {/* Audio */}
      {event.audioLink && (
        <div style={{ padding: "12px 12px 0" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>Message Audio</div>
          <div style={{ background: "var(--md-sys-color-surface-container)", borderRadius: "var(--md-sys-shape-corner-large)", padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <span className="material-symbols-rounded icon-filled" style={{ fontSize: "24px", color: "var(--md-sys-color-primary)" }}>headphones</span>
              <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{event.title}</span>
            </div>
            <audio controls preload="none" style={{ width: "100%", height: "44px", accentColor: "var(--md-sys-color-primary)" }}>
              <source src={audioUrl} type="audio/mpeg" />
              <a href={audioUrl} target="_blank" rel="noreferrer">Download Audio</a>
            </audio>
          </div>
        </div>
      )}

      {/* Slides */}
      {event.slideLink && (
        <div style={{ padding: "12px 12px 0" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>Presentation</div>
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", background: "#111", borderRadius: "var(--md-sys-shape-corner-medium)", overflow: "hidden" }}>
            <iframe src={event.slideLink} allowFullScreen loading="lazy" title="Presentation"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ padding: "12px 12px 4px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>Personal Notes</div>
        <RichEditor filename={filename} initialContent={noteContent} folderHandle={folderHandle} onSaved={onNotesSaved} />
      </div>
    </div>
  );
}

// ── Bible Tab ──────────────────────────────────────────
function BibleTab() {
  const [query, setQuery] = useState("");
  const [trans, setTrans] = useState<"ESV"|"NIV">("ESV");
  const [result, setResult] = useState<BibleVerseResult | null>(null);
  const [searched, setSearched] = useState(false);
  const [bibleModalRef, setBibleModalRef] = useState<string | null>(null);

  const search = () => {
    if (!query.trim()) return;
    const r = lookupBible(query.trim(), trans);
    setResult(r);
    setSearched(true);
  };

  const quickVerses = ["John 3:16","Psalm 23:1","Philippians 4:13","Romans 8:28","Jeremiah 29:11","Isaiah 40:31","Proverbs 3:5","Hebrews 11:1","Philippians 4:6","Romans 8:38","John 14:6","Galatians 5:22"];

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "12px" }}>Quick Verse Search</div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()}
          placeholder="e.g. John 3:16, Rom 8:28-39"
          style={{ flex: 1, padding: "12px 14px", border: "1.5px solid var(--md-sys-color-outline)", borderRadius: "var(--md-sys-shape-corner-small)", background: "var(--md-sys-color-surface)", color: "var(--md-sys-color-on-surface)", fontFamily: "'Google Sans',sans-serif", fontSize: "15px", outline: "none" }} />
        <button className="btn-filled" onClick={search} style={{ padding: "10px 16px", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <span className="material-symbols-rounded">search</span>
        </button>
      </div>
      <div style={{ display: "flex", background: "var(--md-sys-color-surface-container-highest)", borderRadius: "999px", padding: "2px", gap: "2px", maxWidth: "160px", marginBottom: "16px" }}>
        {(["ESV","NIV"] as const).map(t => (
          <button key={t} className={`translation-btn${trans === t ? " active" : ""}`} onClick={() => { setTrans(t); if (searched && query) { const r = lookupBible(query, t); setResult(r); } }}>{t}</button>
        ))}
      </div>
      {searched && (
        <div style={{ padding: "12px", background: "var(--md-sys-color-surface-container)", borderRadius: "var(--md-sys-shape-corner-medium)", marginBottom: "16px" }}>
          {result ? (
            <>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>{result.ref} — {trans}</div>
              {result.verses.map(v => (
                <div key={v.verse} style={{ padding: "6px 0", borderBottom: "1px solid var(--md-sys-color-outline-variant)", fontSize: "15px", lineHeight: 1.6, color: "var(--md-sys-color-on-surface)" }}>
                  <sup style={{ fontSize: "11px", fontWeight: 700, color: "var(--md-sys-color-primary)", marginRight: "4px" }}>{v.verse}</sup>{v.text}
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", color: "var(--md-sys-color-on-surface-variant)", fontSize: "14px" }}>
              <span className="material-symbols-rounded" style={{ fontSize: "36px", display: "block", marginBottom: "8px", opacity: 0.5 }}>search_off</span>
              Verse not found in offline database.
            </div>
          )}
        </div>
      )}
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", marginBottom: "8px" }}>Popular Passages</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {quickVerses.map(v => (
          <button key={v} className="chip" onClick={() => { setQuery(v); const r = lookupBible(v, trans); setResult(r); setSearched(true); }}>{v}</button>
        ))}
      </div>
      {bibleModalRef && <BibleModal ref={bibleModalRef} onClose={() => setBibleModalRef(null)} />}
    </div>
  );
}

// ── Notes Tab ──────────────────────────────────────────
function NotesTab({ folderHandle, onOpenDate }: { folderHandle: FileSystemDirectoryHandle | null; onOpenDate: (date: string) => void }) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    if (!folderHandle) return;
    (async () => {
      const f: string[] = [];
      try {
        for await (const entry of (folderHandle as any).values()) {
          if (entry.kind === "file" && entry.name.endsWith(".html")) f.push(entry.name);
        }
        setFiles(f.sort().reverse());
      } catch {}
    })();
  }, [folderHandle]);

  const formatDate = (dateStr: string) => {
    try {
      const [y,m,d] = dateStr.split("-").map(Number);
      return new Date(y, m-1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch { return dateStr; }
  };

  if (!folderHandle) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--md-sys-color-on-surface-variant)" }}>
        <span className="material-symbols-rounded" style={{ fontSize: "56px", display: "block", marginBottom: "12px", opacity: 0.4 }}>folder_open</span>
        <div style={{ fontSize: "16px", fontWeight: 500, marginBottom: "8px" }}>No Folder Selected</div>
        <div style={{ fontSize: "14px" }}>Go to Settings to choose a folder for your notes.</div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--md-sys-color-on-surface-variant)" }}>
        <span className="material-symbols-rounded" style={{ fontSize: "56px", display: "block", marginBottom: "12px", opacity: 0.4 }}>description</span>
        <div style={{ fontSize: "14px" }}>No notes yet. Select a date and start writing!</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {files.map(f => {
        const parts = f.replace(".html","").split("_");
        const dateStr = parts[0];
        const info = parts.slice(1).join(" ") || "general";
        return (
          <div key={f} onClick={() => onOpenDate(dateStr)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid var(--md-sys-color-outline-variant)", cursor: "pointer", transition: "background 0.15s" }}
            className="list-item">
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--md-sys-color-surface-container-high)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-rounded icon-filled" style={{ fontSize: "20px", color: "var(--md-sys-color-primary)" }}>description</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--md-sys-color-on-surface)" }}>{formatDate(dateStr)}</div>
              <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", textTransform: "capitalize" }}>{info}</div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: "20px", color: "var(--md-sys-color-on-surface-variant)" }}>chevron_right</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────
function SettingsTab({ folderHandle, onPickFolder, onExport, onImport }: {
  folderHandle: FileSystemDirectoryHandle | null;
  onPickFolder: () => void;
  onExport: () => void;
  onImport: () => void;
}) {
  const importRef = useRef<HTMLInputElement>(null);
  const items = [
    { icon: "folder", bg: "var(--md-sys-color-secondary-container)", ic: "var(--md-sys-color-on-secondary-container)", label: "Notes Folder", sub: folderHandle ? `📁 ${folderHandle.name}` : "No folder selected", action: onPickFolder },
    { icon: "download", bg: "var(--md-sys-color-tertiary-container)", ic: "var(--md-sys-color-on-tertiary-container)", label: "Export Notes Backup", sub: "Save all notes as JSON file", action: onExport },
    { icon: "upload", bg: "var(--md-sys-color-tertiary-container)", ic: "var(--md-sys-color-on-tertiary-container)", label: "Import Notes Backup", sub: "Restore from JSON backup file", action: onImport },
  ];

  return (
    <div style={{ paddingBottom: "16px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", padding: "16px 16px 8px" }}>Storage &amp; Data</div>
      {items.map(item => (
        <div key={item.label} onClick={item.action} className="list-item"
          style={{ borderBottom: "1px solid var(--md-sys-color-outline-variant)", cursor: "pointer" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: item.bg, color: item.ic, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span className="material-symbols-rounded icon-filled">{item.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "16px", color: "var(--md-sys-color-on-surface)" }}>{item.label}</div>
            <div style={{ fontSize: "12px", color: "var(--md-sys-color-on-surface-variant)", marginTop: "2px", wordBreak: "break-all" }}>{item.sub}</div>
          </div>
          <span className="material-symbols-rounded" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>chevron_right</span>
        </div>
      ))}
      <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} id="importInput" />

      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", padding: "16px 16px 8px" }}>App Info</div>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {[["Version","1.3.0"],["Bible","ESV + NIV Offline"],["Offline Mode","✓ Enabled"]].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "14px", color: "var(--md-sys-color-on-surface-variant)" }}>{label}</span>
            <span style={{ fontSize: "14px", fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px" }}>
        <a href="/manage.html" className="btn-tonal w-full" style={{ textDecoration: "none", justifyContent: "center", display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="material-symbols-rounded">admin_panel_settings</span>
          Admin Panel
        </a>
      </div>
      <div style={{ padding: "0 16px" }}>
        <a href="/README.md" target="_blank" rel="noreferrer" className="btn-outlined w-full" style={{ textDecoration: "none", justifyContent: "center", display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="material-symbols-rounded">menu_book</span>
          Setup Guide
        </a>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<TabType>("calendar");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toDateStr(new Date()));
  const [events, setEvents] = useState<Record<string, CalendarEvent>>({});
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [snack, setSnack] = useState<{ message: string; icon: string } | null>(null);
  const [bibleModalRef, setBibleModalRef] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [noteRefresh, setNoteRefresh] = useState(0);

  const showSnack = useCallback((msg: string, icon = "check_circle") => {
    setSnack({ message: msg, icon });
    setTimeout(() => setSnack(null), 3500);
  }, []);

  // ── Service Worker ──────────────────────────────────
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  // ── PWA Install ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  // ── Network status ──────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Firebase Subscription ───────────────────────────
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js" as any);
        const { getFirestore, collection, onSnapshot, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js" as any);
        // Config loaded from public/app.js at runtime
        const cfg = (window as any).__FIREBASE_CONFIG__;
        if (!cfg || cfg.apiKey === "YOUR_API_KEY") return;
        const app = initializeApp(cfg);
        const db = getFirestore(app);
        const q = query(collection(db, "calendar_events"), orderBy("date", "asc"));
        unsub = onSnapshot(q, (snap: any) => {
          const evts: Record<string, CalendarEvent> = {};
          snap.forEach((d: any) => { evts[d.id] = { id: d.id, ...d.data() }; });
          setEvents(evts);
        }, (err: any) => console.warn("[Firestore]", err.message));
      } catch (e) { console.warn("[Firebase] Not available:", e); }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  // ── Folder Init ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await loadHandleFromIDB();
      if (!saved) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perm = await (saved as any).queryPermission({ mode: "readwrite" });
        if (perm === "granted") { setFolderHandle(saved); return; }
        if (perm === "prompt") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const req = await (saved as any).requestPermission({ mode: "readwrite" });
          if (req === "granted") setFolderHandle(saved);
        }
      } catch {}
    })();
  }, []);

  const pickFolder = async () => {
    if (!("showDirectoryPicker" in window)) {
      showSnack("File system access not supported on this browser", "warning");
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: "readwrite", startIn: "documents" });
      setFolderHandle(handle);
      await saveHandleToIDB(handle);
      showSnack(`Folder "${handle.name}" selected!`, "check_circle");
    } catch (e: any) {
      if (e.name !== "AbortError") showSnack("Could not access folder", "error");
    }
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const handleSelectDate = (dateStr: string) => {
    const [y, m] = dateStr.split("-").map(Number);
    setYear(y); setMonth(m - 1);
    setSelectedDate(dateStr);
    setTab("calendar");
  };

  const handleChangeMonth = (delta: number) => {
    setMonth(prev => {
      let nm = prev + delta, ny = year;
      if (nm > 11) { nm = 0; ny++; }
      if (nm < 0) { nm = 11; ny--; }
      setYear(ny);
      return nm;
    });
  };

  const handleExportNotes = async () => {
    if (!folderHandle) { showSnack("No folder selected", "error"); return; }
    const files: Record<string, string> = {};
    try {
      for await (const entry of (folderHandle as any).values()) {
        if (entry.kind === "file" && entry.name.endsWith(".html")) {
          const f = await entry.getFile();
          files[entry.name] = await f.text();
        }
      }
    } catch { showSnack("Export failed", "error"); return; }
    const blob = new Blob([JSON.stringify(files, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vista-notes-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    showSnack(`Exported ${Object.keys(files).length} notes!`, "download");
  };

  const handleImportNotes = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !folderHandle) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        for (const [name, content] of Object.entries(data)) {
          if (typeof name === "string" && name.endsWith(".html")) {
            const fh = await folderHandle.getFileHandle(name, { create: true });
            const w = await fh.createWritable();
            await w.write(content as string);
            await w.close();
          }
        }
        showSnack(`Imported ${Object.keys(data).length} notes!`, "check_circle");
        setNoteRefresh(n => n + 1);
      } catch { showSnack("Import failed — invalid file", "error"); }
    };
    input.click();
  };

  const navItems: Array<{ id: TabType; icon: string; label: string }> = [
    { id: "calendar", icon: "calendar_month", label: "Calendar" },
    { id: "notes", icon: "description", label: "Notes" },
    { id: "bible", icon: "menu_book", label: "Bible" },
    { id: "settings", icon: "settings", label: "Settings" },
  ];

  const currentEvent = selectedDate ? (events[selectedDate] || null) : null;
  const monthLabel = `${MONTHS[month]} ${year}`;

  return (
    <>
      {/* Link to Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />

      <div style={{ minHeight: "100dvh", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", background: "var(--md-sys-color-background)", position: "relative", fontFamily: "'Google Sans', -apple-system, sans-serif" }}>

        {/* Install Banner */}
        {showInstallBanner && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "var(--md-sys-color-primary-container)", color: "var(--md-sys-color-on-primary-container)", margin: "8px", borderRadius: "var(--md-sys-shape-corner-medium)", boxShadow: "var(--md-sys-elevation-1)" }}>
            <span className="material-symbols-rounded icon-filled" style={{ fontSize: "28px" }}>install_mobile</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>Add to Home Screen</div>
              <div style={{ fontSize: "12px", opacity: 0.85 }}>Access your worship planner offline, anytime.</div>
            </div>
            <button onClick={installApp} style={{ background: "var(--md-sys-color-primary)", color: "white", border: "none", borderRadius: "999px", padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Install</button>
            <button onClick={() => setShowInstallBanner(false)} style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "4px" }}>
              <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>close</span>
            </button>
          </div>
        )}

        {/* No folder selected banner */}
        {tab === "calendar" && !folderHandle && (
          <div style={{ margin: "8px", padding: "16px", background: "var(--md-sys-color-primary-container)", borderRadius: "var(--md-sys-shape-corner-large)", color: "var(--md-sys-color-on-primary-container)" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="material-symbols-rounded icon-filled">folder_open</span>
              Choose Your Notes Folder
            </div>
            <div style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: "12px", opacity: 0.9 }}>
              Select a folder on your device to store personal notes. Notes stay 100% private — they never leave your device.
            </div>
            <button className="btn-filled" onClick={pickFolder} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>folder_open</span>
              Choose Folder
            </button>
          </div>
        )}

        {/* Top App Bar */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--md-sys-color-surface)", boxShadow: "var(--md-sys-elevation-2)", display: "flex", alignItems: "center", padding: "0 4px", height: "64px" }}>
          <span className="material-symbols-rounded icon-filled" style={{ padding: "12px", fontSize: "28px", color: "var(--md-sys-color-primary)" }}>auto_awesome</span>
          <span style={{ flex: 1, fontSize: "22px", fontWeight: 400, color: "var(--md-sys-color-on-surface)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Vista Worship</span>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
            {isOnline ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "#E8F5E9", borderRadius: "999px", fontSize: "11px", color: "#2E7D32" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50", display: "inline-block" }} />Online
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "var(--md-sys-color-surface-container-high)", borderRadius: "999px", fontSize: "11px", color: "var(--md-sys-color-on-surface-variant)" }}>
                <span className="material-symbols-rounded" style={{ fontSize: "14px" }}>wifi_off</span>Offline
              </span>
            )}
          </div>
          <a href="/manage.html" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", color: "var(--md-sys-color-on-surface-variant)", textDecoration: "none" }}>
            <span className="material-symbols-rounded">admin_panel_settings</span>
          </a>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: "88px" }}>

          {/* Calendar Tab */}
          <div style={{ display: tab === "calendar" ? "block" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 4px", background: "var(--md-sys-color-surface)" }}>
              <button className="icon-btn" onClick={() => handleChangeMonth(-1)}>
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              <button onClick={() => setShowMonthPicker(true)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 12px", borderRadius: "999px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "'Google Sans',sans-serif", fontSize: "16px", fontWeight: 500, color: "var(--md-sys-color-on-surface)" }}>
                {monthLabel}
                <span className="material-symbols-rounded" style={{ fontSize: "18px", opacity: 0.7 }}>arrow_drop_down</span>
              </button>
              <button className="icon-btn" onClick={() => handleChangeMonth(1)}>
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </div>
            <Calendar year={year} month={month} selectedDate={selectedDate} events={events} onSelectDate={setSelectedDate} onChangeMonth={handleChangeMonth} />
            <div style={{ height: "1px", background: "var(--md-sys-color-outline-variant)" }} />
            {selectedDate ? (
              <DetailPanel
                dateStr={selectedDate}
                event={currentEvent}
                folderHandle={folderHandle}
                onVerseClick={setBibleModalRef}
                onNotesSaved={() => setNoteRefresh(n => n + 1)}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--md-sys-color-on-surface-variant)" }}>
                <span className="material-symbols-rounded" style={{ fontSize: "48px", opacity: 0.4, display: "block", marginBottom: "8px" }}>event</span>
                <div style={{ fontSize: "14px" }}>Select a date to view service details</div>
              </div>
            )}
          </div>

          {/* Notes Tab */}
          <div style={{ display: tab === "notes" ? "block" : "none" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--md-sys-color-primary)", padding: "16px 16px 8px" }}>Your Notes</div>
            <NotesTab key={noteRefresh} folderHandle={folderHandle} onOpenDate={(date) => { handleSelectDate(date); setTab("calendar"); }} />
          </div>

          {/* Bible Tab */}
          <div style={{ display: tab === "bible" ? "block" : "none" }}>
            <BibleTab />
          </div>

          {/* Settings Tab */}
          <div style={{ display: tab === "settings" ? "block" : "none" }}>
            <SettingsTab folderHandle={folderHandle} onPickFolder={pickFolder} onExport={handleExportNotes} onImport={handleImportNotes} />
          </div>

        </main>

        {/* Bottom Nav */}
        <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "var(--md-sys-color-surface-container)", display: "flex", alignItems: "center", justifyContent: "space-around", height: "80px", paddingBottom: "env(safe-area-inset-bottom, 0)", zIndex: 100, boxShadow: "0 -1px 0 var(--md-sys-color-outline-variant)" }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, height: "100%", cursor: "pointer", border: "none", background: "transparent", color: tab === item.id ? "var(--md-sys-color-on-secondary-container)" : "var(--md-sys-color-on-surface-variant)", gap: "4px", paddingTop: "12px", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "64px", height: "32px", borderRadius: "999px", background: tab === item.id ? "var(--md-sys-color-secondary-container)" : "transparent", transition: "background 0.2s" }}>
                <span className={`material-symbols-rounded${tab === item.id ? " icon-filled" : ""}`} style={{ fontSize: "24px" }}>{item.icon}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "0.5px" }}>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>

      {/* Month Picker Dialog */}
      {showMonthPicker && (
        <MonthPickerDialog currentYear={year} currentMonth={month} onSelect={(y, m) => { setYear(y); setMonth(m); }} onClose={() => setShowMonthPicker(false)} />
      )}

      {/* Bible Verse Modal */}
      {bibleModalRef && <BibleModal ref={bibleModalRef} onClose={() => setBibleModalRef(null)} />}

      {/* Snackbar */}
      {snack && <Snackbar message={snack.message} icon={snack.icon} onHide={() => setSnack(null)} />}

      {/* M3 Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; overflow-x: hidden; }
        :root {
          --md-sys-color-primary: #6750A4;
          --md-sys-color-on-primary: #FFFFFF;
          --md-sys-color-primary-container: #EADDFF;
          --md-sys-color-on-primary-container: #21005D;
          --md-sys-color-secondary: #625B71;
          --md-sys-color-on-secondary: #FFFFFF;
          --md-sys-color-secondary-container: #E8DEF8;
          --md-sys-color-on-secondary-container: #1D192B;
          --md-sys-color-tertiary: #7D5260;
          --md-sys-color-on-tertiary: #FFFFFF;
          --md-sys-color-tertiary-container: #FFD8E4;
          --md-sys-color-on-tertiary-container: #31111D;
          --md-sys-color-error: #B3261E;
          --md-sys-color-error-container: #F9DEDC;
          --md-sys-color-on-error-container: #410E0B;
          --md-sys-color-surface: #FFFBFE;
          --md-sys-color-on-surface: #1C1B1F;
          --md-sys-color-surface-variant: #E7E0EC;
          --md-sys-color-on-surface-variant: #49454F;
          --md-sys-color-surface-container-low: #F7F2FA;
          --md-sys-color-surface-container: #F3EDF7;
          --md-sys-color-surface-container-high: #ECE6F0;
          --md-sys-color-surface-container-highest: #E6E0E9;
          --md-sys-color-background: #FFFBFE;
          --md-sys-color-on-background: #1C1B1F;
          --md-sys-color-outline: #79747E;
          --md-sys-color-outline-variant: #CAC4D0;
          --md-sys-color-inverse-surface: #313033;
          --md-sys-color-inverse-on-surface: #F4EFF4;
          --md-sys-color-inverse-primary: #D0BCFF;
          --md-sys-shape-corner-small: 8px;
          --md-sys-shape-corner-medium: 12px;
          --md-sys-shape-corner-large: 16px;
          --md-sys-shape-corner-extra-large: 28px;
          --md-sys-elevation-1: 0px 1px 2px rgba(0,0,0,.3), 0px 1px 3px 1px rgba(0,0,0,.15);
          --md-sys-elevation-2: 0px 1px 2px rgba(0,0,0,.3), 0px 2px 6px 2px rgba(0,0,0,.15);
          --md-sys-elevation-3: 0px 4px 8px 3px rgba(0,0,0,.15), 0px 1px 3px rgba(0,0,0,.3);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --md-sys-color-primary: #D0BCFF;
            --md-sys-color-on-primary: #381E72;
            --md-sys-color-primary-container: #4F378B;
            --md-sys-color-on-primary-container: #EADDFF;
            --md-sys-color-secondary: #CCC2DC;
            --md-sys-color-on-secondary: #332D41;
            --md-sys-color-secondary-container: #4A4458;
            --md-sys-color-on-secondary-container: #E8DEF8;
            --md-sys-color-tertiary: #EFB8C8;
            --md-sys-color-on-tertiary: #492532;
            --md-sys-color-tertiary-container: #633B48;
            --md-sys-color-on-tertiary-container: #FFD8E4;
            --md-sys-color-surface: #141218;
            --md-sys-color-on-surface: #E6E0E9;
            --md-sys-color-surface-variant: #49454F;
            --md-sys-color-on-surface-variant: #CAC4D0;
            --md-sys-color-surface-container-low: #1D1B20;
            --md-sys-color-surface-container: #211F26;
            --md-sys-color-surface-container-high: #2B2930;
            --md-sys-color-surface-container-highest: #36343B;
            --md-sys-color-background: #141218;
            --md-sys-color-on-background: #E6E0E9;
            --md-sys-color-outline: #938F99;
            --md-sys-color-outline-variant: #49454F;
            --md-sys-color-inverse-surface: #E6E0E9;
            --md-sys-color-inverse-on-surface: #322F35;
            --md-sys-color-inverse-primary: #6750A4;
          }
        }
        .material-symbols-rounded {
          font-family: 'Material Symbols Rounded';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          user-select: none;
        }
        .icon-filled { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .icon-btn { display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;border:none;background:transparent;color:var(--md-sys-color-on-surface-variant);cursor:pointer;position:relative;overflow:hidden; }
        .icon-btn:active { background: rgba(0,0,0,0.1); }
        .btn-filled { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;height:40px;border-radius:999px;border:none;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer; }
        .btn-tonal { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;height:40px;border-radius:999px;border:none;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer; }
        .btn-outlined { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 24px;height:40px;border-radius:999px;border:1px solid var(--md-sys-color-outline);background:transparent;color:var(--md-sys-color-primary);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer; }
        .btn-text { display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;height:40px;border-radius:999px;border:none;background:transparent;color:var(--md-sys-color-primary);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer; }
        .w-full { width:100%; }
        .calendar-grid { display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:8px; }
        .calendar-day-header { text-align:center;font-size:11px;font-weight:500;color:var(--md-sys-color-on-surface-variant);padding:4px 0;letter-spacing:0.5px; }
        .calendar-day { display:flex;align-items:center;justify-content:center;aspect-ratio:1;font-size:13px;color:var(--md-sys-color-on-surface);border-radius:50%;cursor:pointer;transition:background 0.15s;position:relative;min-height:36px;font-family:'Google Sans',sans-serif; }
        .calendar-day:hover { background:rgba(103,80,164,0.12); }
        .calendar-day.today { font-weight:600;color:var(--md-sys-color-primary); }
        .calendar-day.today::before { content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--md-sys-color-primary); }
        .calendar-day.selected { background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary); }
        .calendar-day.has-event::after { content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:5px;height:5px;border-radius:50%;background:var(--md-sys-color-tertiary); }
        .calendar-day.selected.has-event::after { background:var(--md-sys-color-on-primary);opacity:0.7; }
        .calendar-day.other-month { color:var(--md-sys-color-on-surface-variant);opacity:0.5; }
        .dialog-scrim { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px; }
        .dialog { background:var(--md-sys-color-surface-container-high);border-radius:var(--md-sys-shape-corner-extra-large);padding:24px;width:100%;max-width:400px;max-height:85vh;overflow-y:auto;box-shadow:var(--md-sys-elevation-3); }
        .translation-toggle { display:flex;background:var(--md-sys-color-surface-container-highest);border-radius:999px;padding:2px;gap:2px; }
        .translation-btn { flex:1;padding:6px 16px;border:none;border-radius:999px;background:transparent;color:var(--md-sys-color-on-surface-variant);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:all 0.2s; }
        .translation-btn.active { background:var(--md-sys-color-surface);color:var(--md-sys-color-primary);box-shadow:var(--md-sys-elevation-1); }
        .chip { display:inline-flex;align-items:center;gap:8px;padding:0 16px;height:32px;border-radius:999px;border:1px solid var(--md-sys-color-outline);background:transparent;color:var(--md-sys-color-on-surface-variant);font-family:'Google Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.15s;white-space:nowrap; }
        .chip.selected { background:var(--md-sys-color-secondary-container);border-color:transparent;color:var(--md-sys-color-on-secondary-container); }
        .chip:active { background:var(--md-sys-color-surface-container-high); }
        .list-item { display:flex;align-items:center;gap:16px;padding:8px 16px;cursor:pointer;transition:background 0.15s; }
        .list-item:active { background:rgba(0,0,0,0.05); }
        .editor-toolbar { display:flex;align-items:center;gap:4px;padding:8px;background:var(--md-sys-color-surface-container);border-radius:var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-small) 0 0;border-bottom:1px solid var(--md-sys-color-outline-variant);overflow-x:auto;scrollbar-width:none;flex-wrap:nowrap; }
        .editor-toolbar::-webkit-scrollbar { display:none; }
        .toolbar-btn { display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;border-radius:4px;border:none;background:transparent;color:var(--md-sys-color-on-surface-variant);cursor:pointer;font-family:'Google Sans',sans-serif;font-size:13px;font-weight:600;transition:background 0.15s;padding:0 8px;white-space:nowrap;flex-shrink:0; }
        .toolbar-btn:hover { background:var(--md-sys-color-surface-container-high); }
        .editor-content { min-height:180px;padding:16px;outline:none;font-family:'Google Sans',sans-serif;font-size:16px;line-height:1.6;color:var(--md-sys-color-on-surface);background:var(--md-sys-color-surface);border:1px solid var(--md-sys-color-outline-variant);border-top:none;border-radius:0 0 var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-small);overflow-y:auto; }
        .editor-content:empty::before { content:attr(data-placeholder);color:var(--md-sys-color-on-surface-variant);pointer-events:none; }
        .editor-content h1 { font-size:24px;font-weight:500; }
        .editor-content h2 { font-size:20px;font-weight:500; }
        .editor-content h3 { font-size:18px;font-weight:500; }
        .snackbar { position:fixed;bottom:96px;left:50%;transform:translateX(-50%);background:var(--md-sys-color-inverse-surface);color:var(--md-sys-color-inverse-on-surface);padding:12px 16px;border-radius:4px;font-family:'Google Sans',sans-serif;font-size:14px;max-width:calc(100vw - 32px);box-shadow:var(--md-sys-elevation-3);z-index:300;display:flex;align-items:center;gap:8px;white-space:nowrap; }
        @keyframes snack-in { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        ::-webkit-scrollbar { width:4px;height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--md-sys-color-outline-variant);border-radius:2px; }
      `}</style>
    </>
  );
}
