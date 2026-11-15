import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

const PC_SLOTS = ['case', 'cpu', 'motherboard', 'gpu', 'ram', 'cooler', 'storage', 'psu', 'fan'];
const MULTI = ['storage', 'fan'];
const MAX_ROWS = 12;
const DAY_LIMIT = 25;

// the same performance model the app draws its benchmark panel with (src/lib/buildCalc.js),
// so whatever the advisor quotes matches the numbers on screen
const GAMES = [
  { name: 'Fortnite', gpu: 230, cpu: 320 },
  { name: 'Counter-Strike 2', gpu: 400, cpu: 450 },
  { name: 'Call of Duty', gpu: 170, cpu: 260 },
  { name: 'Valorant', gpu: 600, cpu: 650 },
  { name: 'Marvel Rivals', gpu: 140, cpu: 200 },
  { name: 'Elden Ring', gpu: 120, cpu: 130, cap: 60 },
  { name: 'League of Legends', gpu: 500, cpu: 600 },
  { name: 'Cyberpunk 2077', gpu: 130, cpu: 180 },
];
const GAME_TABLE = GAMES.map((g) => `${g.name} ${g.gpu}/${g.cpu}${g.cap ? ` (${g.cap} FPS cap)` : ''}`).join(', ');
const RES_FACTORS = '1080p Medium 1.0, 1080p Ultra 1.5, 1440p Ultra 2.4, 4K Medium 2.8, 4K Ultra 4.5';

const SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['questions', 'recommendation'] },
    reply: { type: 'string' },
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          multi: { type: 'boolean' },
        },
        required: ['id', 'question', 'options'],
      },
    },
    build: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          slot: { type: 'string' },
          part_id: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['slot', 'part_id'],
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
    budget: { type: 'number' },
  },
  required: ['status', 'reply'],
};

// Grok answers; Gemini is the helper that takes over only when xAI cannot answer
const XAI_MODELS = ['grok-4', 'grok-3'];

async function callXai(key, model, prompt) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
      stream: false,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${model} (${res.status}): ${detail.slice(0, 130)}`);
  }
  const data = await res.json();
  const content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const text = Array.isArray(content) ? content.map((p) => (p && p.text) || '').join('') : String(content);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`${model} returned no JSON object`);
  return JSON.parse(text.slice(start, end + 1));
}

async function askXai(key, prompt) {
  let lastError = null;
  for (const model of XAI_MODELS) {
    try {
      return await callXai(key, model, prompt);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('No Grok model answered');
}

// model ids and per-model quotas shift on Google's side, so the first one that answers wins
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

async function callGemini(key, model, prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${model} (${res.status}): ${detail.slice(0, 130)}`);
  }
  const data = await res.json();
  const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const text = parts.map((p) => (p && p.text) || '').join('');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error(`${model} returned no JSON object`);
  return JSON.parse(text.slice(start, end + 1));
}

async function askGemini(key, prompt) {
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      return await callGemini(key, model, prompt);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('No Gemini model answered');
}

// Gemini is the primary advisor; Grok is a fallback if Gemini is unavailable or rate limited.
async function askAdvisor(keys, prompt) {
  const failures = [];
  if (keys.gemini) {
    try {
      return { data: await askGemini(keys.gemini, prompt), provider: 'gemini' };
    } catch (e) {
      failures.push(`Gemini: ${String((e && e.message) || e)}`);
    }
  }
  if (keys.xai) {
    try {
      return { data: await askXai(keys.xai, prompt), provider: 'grok' };
    } catch (e) {
      failures.push(`Grok: ${String((e && e.message) || e)}`);
    }
  }
  throw new Error(failures.join(' · ') || 'No AI key configured');
}

const clip = (v) => (typeof v === 'string' ? v.slice(0, 48) : v);

const digestPart = (p) => {
  const specs = {};
  Object.entries(p.specs || {}).forEach(([k, v]) => {
    if (v == null) return;
    if (typeof v === 'object') { specs[k] = clip(JSON.stringify(v)); return; }
    specs[k] = clip(v);
  });
  return {
    id: p.id,
    slot: p.category,
    name: p.name,
    brand: p.brand || '',
    price: p.price ?? null,
    specs,
    // the geometry the app actually renders for this part in the 3D scene
    model_3d: {
      kind: p.model_kind || 'generic_procedural',
      custom_model: !!p.model_url,
      rotation_deg: Array.isArray(p.model_rotation) ? p.model_rotation : null,
    },
  };
};

function buildPrompt(catalog, messages, current, estimates) {
  const transcript = messages.map((m) => `${m.role === 'assistant' ? 'ADVISOR' : 'USER'}: ${m.content}`).join('\n');
  const selected = Object.entries(current || {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n') || 'none yet';
  const measured = estimates && Object.keys(estimates).length ? JSON.stringify(estimates) : 'nothing selected yet';
  return `You are the build advisor inside RigForge, a 3D PC build simulator. You are a veteran system builder interviewing someone so you can design the best PC for exactly what they do, spending their money well.

CATALOG — you may ONLY recommend parts from this list. part_id must be copied exactly, and each part's slot must equal its category:
${JSON.stringify(catalog)}

PARTS ALREADY IN THEIR BUILD:
${selected}

BUILD ESTIMATES — the app's own math on the parts they have selected right now:
${measured}

CONVERSATION SO FAR:
${transcript || 'USER has not said anything yet.'}

PERFORMANCE MODEL — the app computes its on-screen FPS and benchmark numbers with exactly this, so use it and never contradict it:
GPU-limited FPS = game.gpu_ref * (gpu.specs.ts_gpu / 20000) / resolutionFactor
CPU-limited FPS = game.cpu_ref * (cpu.specs.ts_cpu / 13000)
Estimated FPS = the lower of those two, capped at the game's cap when it has one.
Resolution factors: ${RES_FACTORS}
Game references (gpu_ref/cpu_ref): ${GAME_TABLE}
Estimated Time Spy overall is about 1 / (0.85 / gpu.specs.ts_gpu + 0.15 / cpu.specs.ts_cpu)

3D VIEW — every catalog part also carries model_3d: the geometry the app renders for it in the simulated case (procedural, or an imported .glb), while its real physical dimensions live in specs. Treat model_3d as what the user will actually see standing inside the case.

HOW TO BEHAVE
1. To recommend you need two things: their budget, and what the PC is mainly for (which games or software, and screen resolution/refresh rate). If either is missing, set status "questions" and ask at most TWO questions, each with 3-6 short concrete options (include a sensible "Not sure" style option). Never ask about something they already told you.
2. Once budget and main use are known, set status "recommendation" and pick one part for each slot that matters: cpu, motherboard, ram, gpu (skip only for a pure office build), case, cooler, psu, and one or two storage drives. Add case fans only if the case needs them or there is budget left. Once they have answered a question of yours, stop asking and recommend in that same turn.
3. Hard compatibility, never break these: CPU socket must match the motherboard socket; RAM generation must match the motherboard memory type; motherboard form factor must be supported by the case; GPU length must be within the case GPU clearance; cooler height within the case cooler clearance (a big air cooler in a small case is wrong — use an AIO or a low cooler); power supply wattage must be at least 1.3x the estimated total draw; storage interface must suit the board.
4. Spend the budget where it changes real performance for THEIR work: GPU first for gaming, CPU+RAM for simulation/compile/video work, more GPU VRAM for 4K or AI work, good cooling and quiet fans if they asked for quiet. Do not waste money on parts that gain them nothing.
5. If the budget cannot cover their goal, say so plainly in "reply" and recommend the closest compromise while telling them which single upgrade would fix it.
6. "reply" is plain conversational text, 2-4 sentences, no headings, no tables, no asterisks, no bullet lists. Write like a friendly expert talking them through it.
7. Each build entry needs a "why" of one short sentence naming the concrete reason for that specific part.
8. "notes" holds up to 3 short practical notes: the upgrade path later, the tradeoff you made, and anything they must check at checkout.
9. Use catalog prices only. Never invent a part, a price, or a spec, and never recommend two parts of the same single slot.
10. If they ask about a part already in their build, judge it honestly and keep it in the recommendation if it is a good fit.
11. Hard budget rule: keep the sum of the catalog prices of everything you recommend at or under the budget they gave (unless they say it is flexible). If you are over, swap parts for cheaper ones until it fits.
12. Put the budget they stated into "budget" as a plain number of US dollars (0 when they never named one or said it is flexible). Do NOT write a dollar total and do NOT do arithmetic in "reply" — the app calculates and shows the exact total next to your list, so just say in words that it fits (or that it is tight).

13. Sound like you actually listened: answer the specific thing they just said before anything else, quote their own numbers back ("the 1,500 you mentioned", "1440p at 165 Hz"), and never re-ask something they already answered or restate a list they already have.
14. Performance talk: give at most two FPS figures, computed with the model above at THEIR resolution, phrased like "around 140 FPS in Fortnite at 1440p Ultra". For a game outside the reference table, describe it qualitatively instead of inventing a number. If they ask how their current parts perform, use BUILD ESTIMATES.
15. Capacity and data questions get real numbers from specs — RAM size, drive capacity, VRAM — plus what that means for their work (a 16 GB card for 4K timelines and larger Blender scenes, 32 GB of RAM for heavy simulation).
16. Use model_3d with the physical dimensions to judge how parts really sit together: a card that fits but crowds the front fans, an air cooler that overhangs the RAM, a radiator that has to move to the top. Mention it in "why" or "notes" when it matters, and prefer parts that leave clearance.

RESPONSE FORMAT — reply with one JSON object and nothing else (no prose before or after, no code fences), using exactly these fields:
{"status":"questions" or "recommendation","reply":"the sentence(s) you say to them","questions":[{"id":"q1","question":"...","options":["...","..."],"multi":false}],"build":[{"slot":"cpu","part_id":"exact catalog id","why":"one short sentence"}],"notes":["up to three short notes"],"budget":0}
Omit questions when recommending and omit build when asking. status must be "recommendation" exactly when build has parts.`;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Sign in to use the build advisor.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = Array.isArray(body.messages) ? body.messages : [];
    if (!raw.length) return Response.json({ error: 'Tell the advisor what the PC is for first.' }, { status: 400 });

    const messages = raw
      .slice(-16)
      .map((m) => ({ role: m && m.role === 'assistant' ? 'assistant' : 'user', content: String((m && m.content) || '').slice(0, 2000).trim() }))
      .filter((m) => m.content);
    if (!messages.length) return Response.json({ error: 'Tell the advisor what the PC is for first.' }, { status: 400 });

    const all = await base44.entities.Part.list('-created_date', 300);
    const parts = (all || []).filter((p) => PC_SLOTS.includes(p.category));
    if (!parts.length) return Response.json({ error: 'The parts catalog is empty right now.' }, { status: 503 });

    const catalog = parts.map(digestPart);
    const current = body.current && typeof body.current === 'object' ? body.current : {};
    const estimates = body.estimates && typeof body.estimates === 'object' ? body.estimates : null;

    // one daily allowance per person: a single talkative user can never drain the key or its quota
    const day = new Date().toISOString().slice(0, 10);
    const usage = await base44.entities.AdvisorUsage.filter({ created_by_id: user.id, day }).catch(() => []);
    const usedToday = Number(usage[0] && usage[0].count) || 0;
    if (usedToday >= DAY_LIMIT) {
      return Response.json({
        error: `You have used all ${DAY_LIMIT} advisor requests for today. It starts again tomorrow — nothing more is charged to your key until then.`,
        limit: DAY_LIMIT,
        remaining: 0,
      }, { status: 429 });
    }

    const prompt = buildPrompt(catalog, messages, current, estimates);
    const readSecret = (name) => { try { return secrets.get(name); } catch (e) { return null; } };
    const keys = { xai: readSecret('XAI_API_KEY'), gemini: readSecret('GEMINI_API_KEY') };
    if (!keys.xai && !keys.gemini) {
      return Response.json({ error: 'Add GEMINI_API_KEY in Base44 Secrets to power the advisor. XAI_API_KEY is optional and used only as a fallback.' }, { status: 400 });
    }

    let answer = null;
    let out = null;
    try {
      answer = await askAdvisor(keys, prompt);
      out = answer.data;
    } catch (e) {
      return Response.json({ error: `The advisor could not answer: ${String((e && e.message) || e).slice(0, 240)}` }, { status: 502 });
    }
    if (!out || typeof out !== 'object') return Response.json({ error: 'The model returned nothing usable.' }, { status: 502 });

    const remaining = Math.max(0, DAY_LIMIT - usedToday - 1);
    const bump = usage[0]
      ? base44.entities.AdvisorUsage.update(usage[0].id, { count: usedToday + 1 })
      : base44.entities.AdvisorUsage.create({ day, count: 1 });
    await bump.catch(() => null);

    const byId = Object.fromEntries(parts.map((p) => [p.id, p]));
    const build = [];
    const used = new Set();
    (Array.isArray(out.build) ? out.build : []).forEach((row) => {
      if (build.length >= MAX_ROWS) return;
      const part = row && byId[row.part_id];
      if (!part || used.has(part.id)) return;
      const limit = MULTI.includes(part.category) ? 2 : 1;
      if (build.filter((r) => r.slot === part.category).length >= limit) return;
      used.add(part.id);
      build.push({
        slot: part.category,
        why: String((row && row.why) || '').slice(0, 240),
        part: {
          id: part.id,
          name: part.name,
          brand: part.brand || '',
          category: part.category,
          price: part.price ?? null,
          image_url: part.image_url || '',
        },
      });
    });

    const questions = (Array.isArray(out.questions) ? out.questions : [])
      .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length)
      .slice(0, 2)
      .map((q, i) => ({
        id: String(q.id || `q${i + 1}`),
        question: String(q.question).slice(0, 200),
        options: q.options.slice(0, 6).map((o) => String(o).slice(0, 80)),
        multi: !!q.multi,
      }));

    const total = build.reduce((sum, r) => sum + (r.part.price || 0), 0);
    const notes = (Array.isArray(out.notes) ? out.notes : []).slice(0, 3).map((n) => String(n).slice(0, 200));

    // the real total is arithmetic the app owns, not something the model has to get right
    const budget = Number(out.budget) || 0;
    const fmt = (n) => `$${Math.round(n).toLocaleString('en-US')}`;
    const budgetNote = budget > 0 && build.length
      ? (total <= budget
        ? `Comes in at ${fmt(total)} — inside the ${fmt(budget)} you mentioned.`
        : `Comes to ${fmt(total)}, about ${fmt(total - budget)} over the ${fmt(budget)} you mentioned — ask me to trim it.`)
      : null;

    return Response.json({
      status: out.status === 'questions' || !build.length ? 'questions' : 'recommendation',
      reply: String(out.reply || '').slice(0, 1200),
      questions: build.length ? (out.status === 'questions' ? questions : []) : questions,
      build,
      total: Math.round(total * 100) / 100,
      notes: budgetNote ? [budgetNote, ...notes].slice(0, 3) : notes,
      limit: DAY_LIMIT,
      remaining,
      provider: answer ? answer.provider : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}