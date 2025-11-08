import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// --- Types
type Option = { label: string; value: string; score: number };
type Question = {
  id: string;
  label: string;
  help?: string;
  dimension: keyof Scores;
  weight?: number; // default 1
  options: Option[];
};

type Scores = {
  Lifestyle: number;
  Traditions: number;
  Family: number;
  Ambition: number;
  Values: number;
  Openness: number;
};

const DIM_DESCRIPTIONS: Record<keyof Scores, string> = {
  Lifestyle:
    "Day‑to‑day choices like food, wellness, alcohol/smoking, and schedule alignment.",
  Traditions:
    "Comfort with rituals, festivals, and cultural practices (lenient ↔ observant).",
  Family:
    "Expectations on family involvement, living setup, and caregiving outlook.",
  Ambition: "Education, career drive, and financial planning attitude.",
  Values:
    "Personal ethics: honesty, kindness, growth mindset, spiritual curiosity.",
  Openness:
    "Flexibility on differences (diet, city, language), and readiness to adapt.",
};

// --- Questionnaire (inclusive)
const QUESTIONS: Question[] = [
  {
    id: "diet",
    label: "Your diet preference",
    help: "It’s okay if you’re flexible. Some people are vegetarian, some are eggetarian, and some eat non‑veg — all fine here.",
    dimension: "Lifestyle",
    options: [
      { label: "Pure vegetarian", value: "veg", score: 100 },
      { label: "Eggetarian", value: "egg", score: 85 },
      { label: "Non‑veg (occasional)", value: "nvo", score: 70 },
      { label: "Non‑veg (regular)", value: "nvr", score: 60 },
    ],
  },
  {
    id: "alcohol",
    label: "Alcohol / smoking comfort",
    dimension: "Lifestyle",
    options: [
      { label: "Avoid both", value: "avoid", score: 100 },
      {
        label: "Occasional social drinking, no smoking",
        value: "occasional",
        score: 85,
      },
      {
        label: "Comfortable with both in moderation",
        value: "moderation",
        score: 70,
      },
      { label: "Regular drinking/smoking", value: "regular", score: 55 },
    ],
  },
  {
    id: "rituals",
    label: "Religious / ritual engagement",
    help: "Festivals, temple visits, daily puja, samskaras, etc.",
    dimension: "Traditions",
    options: [
      { label: "Regular & observant", value: "observant", score: 100 },
      { label: "Festivals + occasional puja", value: "festivals", score: 85 },
      { label: "Mostly cultural / family‑led", value: "cultural", score: 70 },
      { label: "Rarely engaged", value: "rare", score: 55 },
    ],
  },
  {
    id: "family_setup",
    label: "Preferred living setup",
    help: "No judgment — just expectations.",
    dimension: "Family",
    options: [
      {
        label: "Joint or near parents (supportive)",
        value: "joint",
        score: 100,
      },
      {
        label: "Flexible: visit often, live nearby",
        value: "nearby",
        score: 85,
      },
      { label: "Independent nuclear", value: "nuclear", score: 70 },
      { label: "Relocate far / minimal involvement", value: "far", score: 55 },
    ],
  },
  {
    id: "care_roles",
    label: "Elder‑care & family responsibilities",
    dimension: "Family",
    options: [
      { label: "High priority / shared", value: "high", score: 100 },
      { label: "Important but practical", value: "balanced", score: 85 },
      { label: "Case‑by‑case", value: "case", score: 70 },
      { label: "Low priority", value: "low", score: 55 },
    ],
  },
  {
    id: "career_drive",
    label: "Career intensity / ambition",
    dimension: "Ambition",
    options: [
      { label: "Very driven / leadership track", value: "very", score: 100 },
      { label: "Growth‑oriented / balanced", value: "growth", score: 85 },
      { label: "Steady / work‑life first", value: "steady", score: 70 },
      { label: "Relaxed / low pressure", value: "relaxed", score: 55 },
    ],
  },
  {
    id: "money_view",
    label: "Money & planning attitude",
    dimension: "Ambition",
    options: [
      { label: "Plan, save, invest actively", value: "plan", score: 100 },
      { label: "Save regularly, invest simply", value: "save", score: 85 },
      { label: "Basic savings only", value: "basic", score: 70 },
      { label: "Live in the moment", value: "now", score: 55 },
    ],
  },
  {
    id: "ethics",
    label: "Core values priority",
    help: "Kindness, honesty, respect across differences, personal growth.",
    dimension: "Values",
    options: [
      { label: "Non‑negotiable", value: "nn", score: 100 },
      { label: "Very important", value: "vi", score: 85 },
      { label: "Important", value: "imp", score: 70 },
      { label: "Nice to have", value: "nth", score: 55 },
    ],
  },
  {
    id: "learning",
    label: "Learning & self‑improvement",
    dimension: "Values",
    options: [
      {
        label: "Active learner / courses / books",
        value: "active",
        score: 100,
      },
      { label: "Often learn new things", value: "often", score: 85 },
      { label: "Sometimes", value: "sometimes", score: 70 },
      { label: "Rarely", value: "rare", score: 55 },
    ],
  },
  {
    id: "flex_diet",
    label: "Flexibility with a partner’s diet",
    dimension: "Openness",
    options: [
      {
        label: "Fully comfortable (veg or non‑veg)",
        value: "full",
        score: 100,
      },
      { label: "Mostly okay (some boundaries)", value: "most", score: 85 },
      { label: "Prefer similar diet", value: "similar", score: 70 },
      { label: "Not comfortable", value: "no", score: 55 },
    ],
  },
  {
    id: "relocation",
    label: "City / relocation flexibility",
    dimension: "Openness",
    options: [
      { label: "Open to relocate / travel", value: "open", score: 100 },
      { label: "Open if needed", value: "need", score: 85 },
      { label: "Prefer current city", value: "prefer", score: 70 },
      { label: "Not open", value: "not", score: 55 },
    ],
  },
  {
    id: "customs_mix",
    label: "Blending different customs within  sub‑traditions",
    help: "E.g., Vaidiki / Smarta / Iyer / Iyengar / Maithil etc.",
    dimension: "Traditions",
    options: [
      { label: "Happily blend & learn", value: "blend", score: 100 },
      { label: "Open with discussion", value: "discuss", score: 85 },
      { label: "Prefer my own mostly", value: "own", score: 70 },
      { label: "Prefer only my own", value: "only", score: 55 },
    ],
  },
];

// --- Utilities
function normalizeScores(raw: Partial<Record<string, Option>>): Scores {
  const base: Scores = {
    Lifestyle: 0,
    Traditions: 0,
    Family: 0,
    Ambition: 0,
    Values: 0,
    Openness: 0,
  };
  const totals: Record<keyof Scores, { sum: number; w: number }> = {
    Lifestyle: { sum: 0, w: 0 },
    Traditions: { sum: 0, w: 0 },
    Family: { sum: 0, w: 0 },
    Ambition: { sum: 0, w: 0 },
    Values: { sum: 0, w: 0 },
    Openness: { sum: 0, w: 0 },
  };
  for (const q of QUESTIONS) {
    const ans = raw[q.id];
    if (!ans) continue;
    const w = q.weight ?? 1;
    totals[q.dimension].sum += ans.score * w;
    totals[q.dimension].w += w;
  }
  (Object.keys(base) as (keyof Scores)[]).forEach((k) => {
    base[k] = totals[k].w ? Math.round(totals[k].sum / totals[k].w) : 0;
  });
  return base;
}

function archetype(scores: Scores) {
  const entries = Object.entries(scores) as [keyof Scores, number][];
  const top2 = entries.sort((a, b) => b[1] - a[1]).slice(0, 2);
  const [a, b] = top2.map((t) => t[0]);
  const titleMap: Record<string, string> = {
    LifestyleTraditions: "Rooted & Rhythmic",
    TraditionsLifestyle: "Rooted & Rhythmic",
    LifestyleOpenness: "Easy‑going Explorer",
    OpennessLifestyle: "Easy‑going Explorer",
    FamilyTraditions: "Family‑First Harmonizer",
    TraditionsFamily: "Family‑First Harmonizer",
    AmbitionValues: "Purpose‑Driven Achiever",
    ValuesAmbition: "Purpose‑Driven Achiever",
    OpennessValues: "Curious & Kind",
    ValuesOpenness: "Curious & Kind",
    AmbitionLifestyle: "Balanced Go‑Getter",
    LifestyleAmbition: "Balanced Go‑Getter",
  };
  const key = `${a}${b}`;
  const title = titleMap[key] || "Well‑Rounded Companion";
  const brief = {
    "Rooted & Rhythmic":
      "You enjoy steady routines and respectful continuity with culture while staying practical.",
    "Easy‑going Explorer":
      "You adapt easily, value comfort in day‑to‑day life, and welcome differences with grace.",
    "Family‑First Harmonizer":
      "Family bonds matter a lot to you; you like building a warm, cooperative home.",
    "Purpose‑Driven Achiever":
      "Growth and integrity guide your choices; you plan for the future and aim high.",
    "Curious & Kind":
      "Empathy and an open mind shape how you connect and solve problems together.",
    "Balanced Go‑Getter":
      "Ambitious yet grounded — you balance progress with wellbeing and simplicity.",
    "Well‑Rounded Companion":
      "You bring a stable, adaptable presence across traditions, family, and growth.",
  } as Record<string, string>;
  return { title, brief: brief[title] };
}

function scoreToBadge(score: number) {
  if (score >= 90)
    return { label: "Very High", tone: "bg-green-100 text-green-800" };
  if (score >= 80)
    return { label: "High", tone: "bg-emerald-100 text-emerald-800" };
  if (score >= 70)
    return { label: "Moderate", tone: "bg-amber-100 text-amber-800" };
  if (score > 0) return { label: "Low", tone: "bg-orange-100 text-orange-800" };
  return { label: "—", tone: "bg-slate-100 text-slate-500" };
}

function hashProfile(obj: any) {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 8).toUpperCase();
}

function encodeAnswers(answers: Partial<Record<string, Option>>) {
  const minimal = Object.fromEntries(
    Object.entries(answers).map(([k, v]) => [k, v?.value])
  );
  const s = JSON.stringify({ v: 1, a: minimal });
  return btoa(unescape(encodeURIComponent(s)));
}

function decodeAnswers(token: string): Partial<Record<string, Option>> | null {
  try {
    const s = decodeURIComponent(escape(atob(token)));
    const data = JSON.parse(s);
    if (!data?.a) return null;
    const map: Partial<Record<string, Option>> = {};
    for (const q of QUESTIONS) {
      const val = data.a[q.id];
      const opt = q.options.find((o) => o.value === val);
      if (opt) map[q.id] = opt;
    }
    return map;
  } catch (e) {
    return null;
  }
}

function delta(a: Scores, b: Scores) {
  const keys = Object.keys(a) as (keyof Scores)[];
  const rows = keys.map((k) => ({
    dimension: k,
    you: a[k],
    partner: b[k],
    gap: Math.abs(a[k] - b[k]),
  }));
  const avgGap = Math.round(rows.reduce((s, r) => s + r.gap, 0) / rows.length);
  const compatibility = Math.max(0, 100 - avgGap);
  return { rows, avgGap, compatibility };
}

export default function App() {
  const [answers, setAnswers] = useState<Partial<Record<string, Option>>>({});
  const [linkOptIn, setLinkOptIn] = useState(false);
  const [dealMin, setDealMin] = useState<Record<keyof Scores, number>>({
    Lifestyle: 0,
    Traditions: 0,
    Family: 0,
    Ambition: 0,
    Values: 0,
    Openness: 0,
  });
  const [partnerToken, setPartnerToken] = useState("");
  const [partnerScores, setPartnerScores] = useState<Scores | null>(null);

  // load from URL if present
  useEffect(() => {
    const m = location.hash.match(/#p=([^&]+)/);
    if (m?.[1]) {
      const decoded = decodeAnswers(m[1]);
      if (decoded) setAnswers(decoded);
      setLinkOptIn(true);
    }
  }, []);

  const scores = useMemo(() => normalizeScores(answers), [answers]);
  const arc = useMemo(() => archetype(scores), [scores]);
  const completion = useMemo(() => {
    const answered = Object.keys(answers).length;
    return Math.round((answered / QUESTIONS.length) * 100);
  }, [answers]);

  const data = (Object.keys(scores) as (keyof Scores)[]).map((k) => ({
    subject: k,
    A: scores[k],
  }));

  const profileId = useMemo(() => hashProfile({ scores }), [scores]);

  function selectAnswer(q: Question, opt: Option) {
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  }

  function reset() {
    setAnswers({});
    setPartnerScores(null);
    setPartnerToken("");
    setLinkOptIn(false);
    history.replaceState(null, "", location.pathname);
  }

  // --- Shareable link
  const shareToken = useMemo(() => encodeAnswers(answers), [answers]);
  const shareLink = useMemo(() => {
    if (!linkOptIn) return "";
    const base = location.origin + location.pathname;
    return `${base}#p=${shareToken}`;
  }, [linkOptIn, shareToken]);

  function copyShare() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    alert("Sharable link copied.");
  }

  // --- Partner matching
  function loadPartner() {
    const tokenMatch =
      partnerToken.match(/#p=([^&]+)/) ||
      partnerToken.match(/^([A-Za-z0-9+/=]+)$/);
    const token = tokenMatch?.[1];
    if (!token) {
      alert(
        "Paste your partner's link (containing #p=...) or the base64 token only."
      );
      return;
    }
    const decoded = decodeAnswers(token);
    if (!decoded) {
      alert("Could not read partner data.");
      return;
    }
    setPartnerScores(normalizeScores(decoded));
  }

  const cmp = useMemo(
    () => (partnerScores ? delta(scores, partnerScores) : null),
    [scores, partnerScores]
  );

  const dealHits = useMemo(() => {
    if (!partnerScores)
      return [] as { k: keyof Scores; need: number; got: number }[];
    const keys = Object.keys(dealMin) as (keyof Scores)[];
    return keys
      .filter((k) => dealMin[k] > 0 && partnerScores[k] < dealMin[k])
      .map((k) => ({ k, need: dealMin[k], got: partnerScores[k] }));
  }, [dealMin, partnerScores]);

  // --- Mock community insights (privacy‑first demo)
  const MOCK = useMemo(
    () => [
      {
        city: "Delhi",
        age: 24,
        Lifestyle: 78,
        Traditions: 72,
        Family: 75,
        Ambition: 82,
        Values: 88,
        Openness: 80,
      },
      {
        city: "Mumbai",
        age: 27,
        Lifestyle: 83,
        Traditions: 65,
        Family: 70,
        Ambition: 86,
        Values: 84,
        Openness: 85,
      },
      {
        city: "Chennai",
        age: 26,
        Lifestyle: 75,
        Traditions: 88,
        Family: 78,
        Ambition: 79,
        Values: 90,
        Openness: 68,
      },
      {
        city: "Bengaluru",
        age: 25,
        Lifestyle: 81,
        Traditions: 70,
        Family: 73,
        Ambition: 88,
        Values: 87,
        Openness: 86,
      },
      {
        city: "Kolkata",
        age: 28,
        Lifestyle: 76,
        Traditions: 77,
        Family: 80,
        Ambition: 74,
        Values: 85,
        Openness: 72,
      },
    ],
    []
  );
  const [city, setCity] = useState<string>("Delhi");
  const [ageMax, setAgeMax] = useState<number>(30);
  const agg = useMemo(() => {
    const rows = MOCK.filter((r) => r.city === city && r.age <= ageMax);
    const keys = Object.keys(scores) as (keyof Scores)[];
    const avg = keys.reduce(
      (o, k) => ({
        ...o,
        [k]: Math.round(
          rows.reduce((s, r) => s + (r as any)[k], 0) / rows.length || 0
        ),
      }),
      {} as any
    );
    return { rows, avg } as { rows: any[]; avg: Scores };
  }, [MOCK, city, ageMax, scores]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-slate-800">
      <header className="max-w-5xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Sama‑Matr: Value Compatibility
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              A respectful, inclusive way to understand everyday alignment
              across lifestyle, traditions, family, ambition, shared values, and
              openness.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Completion
            </div>
            <div className="text-2xl font-semibold">{completion}%</div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24">
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 sm:p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              Answer a few quick questions
            </h2>
            <div className="space-y-5">
              {QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{q.label}</div>
                      {q.help && (
                        <div className="text-xs text-slate-500 mt-1">
                          {q.help}
                        </div>
                      )}
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-600">
                      {q.dimension}
                    </div>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const isActive = answers[q.id]?.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => selectAnswer(q, opt)}
                          className={`text-left px-3 py-2 rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                            isActive
                              ? "border-amber-500 bg-amber-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="text-sm font-medium">{opt.label}</div>
                          <div className="text-xs text-slate-500">
                            preference
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={reset}
                  className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                >
                  Reset
                </button>
                <div className="text-xs text-slate-500">
                  Your answers stay on this page only, unless you opt‑in to
                  share.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 sm:p-6"
          >
            <h2 className="text-xl font-semibold mb-4">
              Your compatibility profile
            </h2>
            <div className="grid gap-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="text-sm uppercase tracking-wide text-amber-800">
                  Persona
                </div>
                <div className="text-2xl font-bold mt-1">{arc.title}</div>
                <div className="text-slate-700 mt-1">{arc.brief}</div>
                <div className="mt-2 text-xs text-amber-700/80">
                  Profile ID: {profileId}
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="You" dataKey="A" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {(Object.keys(scores) as (keyof Scores)[]).map((k) => {
                  const badge = scoreToBadge(scores[k]);
                  return (
                    <div key={k} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{k}</div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {DIM_DESCRIPTIONS[k]}
                      </div>
                      <div className="mt-2 text-sm">
                        Score:{" "}
                        <span className="font-semibold">{scores[k]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shareable link with opt‑in visibility */}
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-2">
                  Sharable link & privacy
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={linkOptIn}
                    onChange={(e) => {
                      setLinkOptIn(e.target.checked);
                      if (e.target.checked) {
                        const url = `${location.origin}${location.pathname}#p=${shareToken}`;
                        history.replaceState(null, "", url);
                      } else {
                        history.replaceState(null, "", location.pathname);
                      }
                    }}
                  />
                  Opt‑in: allow others to view this profile via link.
                </label>
                <div className="mt-2 grid sm:grid-cols-[1fr_auto] gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm"
                    readOnly
                    value={shareLink || "(Disabled — toggle opt‑in)"}
                  />
                  <button
                    onClick={copyShare}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                    disabled={!shareLink}
                  >
                    Copy link
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Your answers are encoded in the URL. Disable opt‑in to remove
                  them from the address bar.
                </p>
              </div>

              {/* Two‑person matching */}
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-2">Two‑person matching</div>
                <p className="text-sm text-slate-600 mb-2">
                  Paste your partner’s link (that contains <code>#p=...</code>)
                  or the token only.
                </p>
                <div className="grid sm:grid-cols-[1fr_auto] gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm"
                    placeholder="https://…#p=BASE64 or BASE64 token"
                    value={partnerToken}
                    onChange={(e) => setPartnerToken(e.target.value.trim())}
                  />
                  <button
                    onClick={loadPartner}
                    className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm"
                  >
                    Load
                  </button>
                </div>

                {cmp && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Average gap</div>
                      <div className="text-lg font-semibold">{cmp.avgGap}</div>
                    </div>
                    <div className="text-sm">
                      Overall compatibility:{" "}
                      <span className="font-semibold">{cmp.compatibility}</span>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-2">
                      {cmp.rows.map((r) => (
                        <div
                          key={r.dimension}
                          className={`p-3 rounded-lg border ${
                            r.gap <= 10
                              ? "border-emerald-300 bg-emerald-50"
                              : r.gap <= 20
                              ? "border-amber-300 bg-amber-50"
                              : "border-rose-300 bg-rose-50"
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="font-medium">{r.dimension}</div>
                            <div>Δ {r.gap}</div>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            You {r.you} • Partner {r.partner}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Deal‑breakers */}
                    <div className="mt-4 p-3 border rounded-lg">
                      <div className="font-semibold mb-2">
                        Deal‑breakers (minimum partner scores)
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {(Object.keys(scores) as (keyof Scores)[]).map((k) => (
                          <label key={k} className="text-sm">
                            <div className="flex items-center justify-between">
                              <span className="mr-2">{k}</span>
                              <span className="text-xs text-slate-500">
                                {dealMin[k]}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={dealMin[k]}
                              onChange={(e) =>
                                setDealMin((d) => ({
                                  ...d,
                                  [k]: Number(e.target.value),
                                }))
                              }
                              className="w-full"
                            />
                          </label>
                        ))}
                      </div>
                      {dealHits.length > 0 ? (
                        <div className="mt-3 text-sm text-rose-700">
                          {dealHits.map((h) => (
                            <div key={h.k}>
                              {h.k}: need ≥ {h.need}, partner has {h.got}
                            </div>
                          ))}
                        </div>
                      ) : (
                        partnerScores && (
                          <div className="mt-3 text-sm text-emerald-700">
                            No deal‑breakers triggered.
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* How results are generated */}
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-1">
                  How results are generated
                </div>
                <p className="text-sm text-slate-700">
                  Each answer maps to a 55–100 score per dimension. We average
                  scores (with light weighting) inside each dimension to get six
                  0–100 values. Your persona is derived from your top two
                  dimensions. Shareable links encode only your selected options.
                </p>
              </div>

              {/* Community insights (mock, privacy‑first) */}
              <div className="border rounded-xl p-4">
                <div className="font-semibold mb-2">
                  Community insights (anonymized demo)
                </div>
                <div className="grid sm:grid-cols-3 gap-3 items-end">
                  <label className="text-sm">
                    <div className="mb-1">City</div>
                    <select
                      className="border rounded-lg px-3 py-2 text-sm w-full"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    >
                      <option>Delhi</option>
                      <option>Mumbai</option>
                      <option>Chennai</option>
                      <option>Bengaluru</option>
                      <option>Kolkata</option>
                    </select>
                  </label>
                  <label className="text-sm">
                    <div className="mb-1">Max age</div>
                    <input
                      type="number"
                      className="border rounded-lg px-3 py-2 text-sm w-full"
                      value={ageMax}
                      onChange={(e) => setAgeMax(Number(e.target.value) || 0)}
                    />
                  </label>
                  <div className="text-xs text-slate-500">
                    Sample size: {agg.rows.length}
                  </div>
                </div>
                <div className="h-72 mt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(Object.keys(scores) as (keyof Scores)[]).map(
                        (k) => ({ name: k, avg: (agg.avg as any)[k] || 0 })
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avg" name="Avg score" fillOpacity={0.6} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Real product would aggregate only with strong K‑anonymity and
                  opt‑in consent.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10 text-xs text-slate-500">
        Made with respect for all dietary and cultural preferences within the
        humans — inclusivity first.
      </footer>
    </div>
  );
}
