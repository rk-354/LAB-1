/* ============================================================
   RefinerIQ — Mock data (TypeScript)
   ============================================================ */

export interface Department {
  id: string;
  name: string;
  short: string;
}

export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'End User';
  dept: string;
  status: boolean;
  init: string;
  seen: string;
}

export interface Document {
  name: string;
  v: string;
  dept: string;
  date: string;
  status: 'Indexed' | 'Processing' | 'Review';
  size: string;
}

export interface Citation {
  id: number;
  doc: string;
  page: string;
  dept: string;
}

export interface MessageBlock {
  type: 'p' | 'list' | 'step';
  text?: string;
  items?: string[];
  h?: string;
  b?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  blocks?: MessageBlock[];
  model?: string;
  citations?: Citation[];
  feedback: null | 'up' | 'down';
  _justFinished?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  dept: string;
  time: string;
  pinned?: boolean;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  delta: string;
  dir: 'up' | 'down';
  sub: string;
}

export interface CoverageItem {
  dept: string;
  pct: number;
  docs: number;
}

export interface ActivityItem {
  who: string;
  act: string;
  obj: string;
  dept: string;
  time: string;
  init: string;
}

export interface RecentQuery {
  q: string;
  user: string;
  dept: string;
  sentiment: 'pos' | 'warn' | 'neg';
  time: string;
}

export interface DemoAnswer {
  question: string;
  dept: string;
  model: string;
  paragraphs: string[];
  steps: { h: string; b: string }[];
  closing: string;
  citations: Citation[];
}

export const DEPARTMENTS: Department[] = [
  { id: "all",        name: "All Departments", short: "ALL" },
  { id: "ops",        name: "Operations",      short: "OPS" },
  { id: "safety",     name: "Health & Safety", short: "HSE" },
  { id: "hr",         name: "Human Resources", short: "HR"  },
  { id: "compliance", name: "Compliance",      short: "CMP" },
  { id: "maint",      name: "Maintenance",     short: "MNT" },
];

export const CURRENT_USER = {
  name: "Dana Okafor",
  role: "Admin" as const,
  email: "d.okafor@refineiq.io",
  initials: "DO",
};

export const CONVERSATIONS: Conversation[] = [
  { id: "c1", title: "Confined space entry permits", dept: "safety", time: "2m",  pinned: true },
  { id: "c2", title: "PTO carryover policy 2026",     dept: "hr",     time: "1h"  },
  { id: "c3", title: "Crude unit shutdown sequence",  dept: "ops",    time: "3h"  },
  { id: "c4", title: "EPA Tier 3 reporting deadline",  dept: "compliance", time: "Yesterday" },
  { id: "c5", title: "Pump P-204 maintenance log",     dept: "maint",  time: "Yesterday" },
  { id: "c6", title: "Contractor onboarding checklist",dept: "hr",     time: "2d" },
  { id: "c7", title: "H2S exposure response protocol",  dept: "safety", time: "3d" },
  { id: "c8", title: "Flare gas recovery efficiency",   dept: "ops",    time: "4d" },
];

export const DEMO_ANSWER: DemoAnswer = {
  question: "What's the procedure for a confined space entry permit?",
  dept: "safety",
  model: "Claude Sonnet 4.5",
  paragraphs: [
    "A confined space entry requires a signed permit before anyone enters. The process has four mandatory gates [1]:",
  ],
  steps: [
    { h: "1 · Hazard assessment", b: "The entry supervisor identifies atmospheric, mechanical, and engulfment hazards and confirms the space is reclassified as 'entry-ready' [1]." },
    { h: "2 · Atmospheric testing", b: "Test oxygen (19.5–23.5%), flammables (<10% LEL), and toxics (H₂S, CO) in that order. Re-test continuously while occupied [2]." },
    { h: "3 · Permit authorization", b: "The permit must be signed by the entry supervisor and a qualified gas tester, valid for one shift maximum [1]." },
    { h: "4 · Attendant & rescue", b: "A trained attendant stays outside at all times, with retrieval equipment staged and rescue services notified [3]." },
  ],
  closing: "Permits are void if conditions change — for example, if ventilation stops or a new hazard is introduced.",
  citations: [
    { id: 1, doc: "HSE Confined Space Procedure v4.2.pdf", page: "p.3", dept: "safety" },
    { id: 2, doc: "Atmospheric Testing Standard.pdf",       page: "p.11", dept: "safety" },
    { id: 3, doc: "Emergency Rescue Plan 2026.pdf",         page: "p.7",  dept: "safety" },
  ],
};

export const SEED_THREAD: ChatMessage[] = [
  {
    id: "m1", role: "user",
    text: "Where can I find the current PPE requirements for the crude distillation unit?",
    feedback: null,
  },
  {
    id: "m2", role: "ai",
    model: "GPT-4o",
    blocks: [
      { type: "p", text: "PPE requirements for the crude distillation unit (CDU) are defined in the site safety manual. The baseline for routine entry is [1]:" },
      { type: "list", items: [
        "FR coveralls (NFPA 2112 rated) and steel-toe boots",
        "Hard hat with chin strap in elevated work zones",
        "Safety glasses with side shields, plus face shield when sampling",
        "H₂S monitor — personal, calibrated within 30 days",
      ]},
      { type: "p", text: "Hot-work and confined-space tasks layer additional PPE on top of this baseline [2]." },
    ],
    citations: [
      { id: 1, doc: "Site Safety Manual v7.pdf", page: "p.24", dept: "safety" },
      { id: 2, doc: "Hot Work Standard.pdf", page: "p.5", dept: "safety" },
    ],
    feedback: null,
  },
];

export const STATS: Stat[] = [
  { id: "docs",    label: "Total Documents", value: "4,182",  delta: "+128", dir: "up",   sub: "this month" },
  { id: "users",   label: "Active Users",    value: "316",    delta: "+12",  dir: "up",   sub: "vs last week" },
  { id: "queries", label: "Queries Today",   value: "1,947",  delta: "+9%",  dir: "up",   sub: "vs yesterday" },
  { id: "resp",    label: "Avg Response",    value: "1.4s",   delta: "-0.3s",dir: "down", sub: "faster" },
];

export const COVERAGE: CoverageItem[] = [
  { dept: "Operations",      pct: 94, docs: 1240 },
  { dept: "Health & Safety", pct: 88, docs: 980  },
  { dept: "Compliance",      pct: 76, docs: 612  },
  { dept: "Maintenance",     pct: 71, docs: 740  },
  { dept: "Human Resources", pct: 63, docs: 410  },
];

export const ACTIVITY: ActivityItem[] = [
  { who: "Marcus Lee",   act: "uploaded",  obj: "Turnaround Plan Q3.pdf", dept: "ops",        time: "4m",  init: "ML" },
  { who: "System",       act: "indexed",   obj: "12 documents",           dept: "compliance", time: "18m", init: "AI" },
  { who: "Priya Raman",  act: "invited",   obj: "j.torres@refineiq.io",   dept: "hr",         time: "41m", init: "PR" },
  { who: "Dana Okafor",  act: "archived",  obj: "Legacy SOP v2.pdf",      dept: "ops",        time: "1h",  init: "DO" },
  { who: "Sam Whitfield",act: "updated",   obj: "H2S Response Protocol",  dept: "safety",     time: "2h",  init: "SW" },
  { who: "System",       act: "re-indexed",obj: "HR policy bundle",       dept: "hr",         time: "3h",  init: "AI" },
];

export const RECENT_QUERIES: RecentQuery[] = [
  { q: "Confined space entry permit steps",   user: "T. Nguyen",  dept: "safety",     sentiment: "pos",  time: "2m" },
  { q: "Can contractors claim overtime?",      user: "R. Diaz",    dept: "hr",         sentiment: "warn", time: "9m" },
  { q: "Flare gas recovery target 2026",       user: "M. Lee",     dept: "ops",        sentiment: "pos",  time: "14m" },
  { q: "Why was my Tier 3 report rejected?",   user: "K. Brooks",  dept: "compliance", sentiment: "neg",  time: "22m" },
  { q: "Pump P-204 lubrication interval",      user: "A. Silva",   dept: "maint",      sentiment: "pos",  time: "31m" },
  { q: "Vacation accrual during medical leave",user: "J. Park",    dept: "hr",         sentiment: "warn", time: "47m" },
];

export const USERS: User[] = [
  { name: "Dana Okafor",    email: "d.okafor@refineiq.io",   role: "Admin",    dept: "Operations",      status: true,  init: "DO", seen: "now" },
  { name: "Marcus Lee",     email: "m.lee@refineiq.io",      role: "Manager",  dept: "Operations",      status: true,  init: "ML", seen: "4m" },
  { name: "Priya Raman",    email: "p.raman@refineiq.io",    role: "Manager",  dept: "Human Resources", status: true,  init: "PR", seen: "41m" },
  { name: "Sam Whitfield",  email: "s.whitfield@refineiq.io",role: "End User", dept: "Health & Safety", status: true,  init: "SW", seen: "2h" },
  { name: "Kofi Brooks",    email: "k.brooks@refineiq.io",   role: "End User", dept: "Compliance",      status: false, init: "KB", seen: "5d" },
  { name: "Alina Silva",    email: "a.silva@refineiq.io",    role: "End User", dept: "Maintenance",     status: true,  init: "AS", seen: "1h" },
  { name: "Jordan Park",    email: "j.park@refineiq.io",     role: "End User", dept: "Human Resources", status: true,  init: "JP", seen: "3h" },
  { name: "Tara Nguyen",    email: "t.nguyen@refineiq.io",   role: "Manager",  dept: "Health & Safety", status: true,  init: "TN", seen: "2m" },
];

export const DOCUMENTS: Document[] = [
  { name: "HSE Confined Space Procedure", v: "v4.2", dept: "Health & Safety", date: "Jun 2, 2026",  status: "Indexed",    size: "2.4 MB" },
  { name: "Site Safety Manual",           v: "v7.0", dept: "Health & Safety", date: "May 28, 2026", status: "Indexed",    size: "18.1 MB" },
  { name: "PTO & Leave Policy",           v: "v3.1", dept: "Human Resources", date: "May 24, 2026", status: "Indexed",    size: "880 KB" },
  { name: "Crude Unit Shutdown SOP",      v: "v2.9", dept: "Operations",      date: "May 20, 2026", status: "Processing", size: "5.6 MB" },
  { name: "EPA Tier 3 Reporting Guide",   v: "v1.4", dept: "Compliance",      date: "May 19, 2026", status: "Indexed",    size: "3.2 MB" },
  { name: "Pump Maintenance Schedule",    v: "v6.0", dept: "Maintenance",     date: "May 15, 2026", status: "Indexed",    size: "1.1 MB" },
  { name: "Emergency Rescue Plan",        v: "v2.0", dept: "Health & Safety", date: "May 11, 2026", status: "Review",     size: "4.0 MB" },
  { name: "Contractor Onboarding Pack",   v: "v5.3", dept: "Human Resources", date: "May 8, 2026",  status: "Indexed",    size: "6.7 MB" },
];

export const deptName = (id: string): string =>
  (DEPARTMENTS.find(d => d.id === id) || { name: id }).name;

export const deptShort = (id: string): string =>
  (DEPARTMENTS.find(d => d.id === id) || { short: id }).short;
