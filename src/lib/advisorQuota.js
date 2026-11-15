import { base44 } from '@/api/base44Client';

// must match DAY_LIMIT in base44/functions/aiBuildAdvisor — the server is the one that enforces it
export const ADVISOR_DAY_LIMIT = 25;

export const todayKey = () => new Date().toISOString().slice(0, 10);

// row-level security limits this read to the signed-in user's own counter
export async function loadAdvisorUsage() {
  const day = todayKey();
  const rows = await base44.entities.AdvisorUsage.filter({ day });
  return { day, used: Number(rows[0] && rows[0].count) || 0 };
}