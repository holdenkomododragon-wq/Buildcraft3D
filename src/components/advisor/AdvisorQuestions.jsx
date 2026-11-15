import { useState } from 'react';
import { Check } from 'lucide-react';

export default function AdvisorQuestions({ questions, onAnswer, disabled }) {
  const [picked, setPicked] = useState({});

  const toggle = (q, opt) => setPicked((p) => {
    const cur = p[q.id] || [];
    return { ...p, [q.id]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
  });

  return (
    <div className="max-w-[92%] space-y-3 rounded-lg border border-[#232323] bg-[#131313] p-3">
      {questions.map((q) => {
        const chosen = picked[q.id] || [];
        return (
          <div key={q.id} className="space-y-1.5">
            <p className="text-[11.5px] font-medium text-[#d4d4d8]">{q.question}</p>
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt) => {
                const on = chosen.includes(opt);
                if (!q.multi) {
                  return (
                    <button key={opt} type="button" disabled={disabled} onClick={() => onAnswer(opt)} className="rounded-full border border-[#2a2a2a] bg-[#161616] px-2.5 py-1 text-[11px] text-[#b3b3bb] transition-colors hover:border-[#ff2e8c] hover:text-white disabled:opacity-60">{opt}</button>
                  );
                }
                return (
                  <button key={opt} type="button" disabled={disabled} onClick={() => toggle(q, opt)} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-60 ${on ? 'border-[#ff2e8c] bg-[#ff2e8c]/15 text-white' : 'border-[#2a2a2a] bg-[#161616] text-[#b3b3bb] hover:border-[#3d3d3d] hover:text-white'}`}>
                    {on ? <Check className="h-3 w-3" /> : null}{opt}
                  </button>
                );
              })}
            </div>
            {q.multi && (
              <button
                type="button"
                disabled={disabled || !chosen.length}
                onClick={() => { onAnswer(chosen.join(', ')); setPicked((p) => ({ ...p, [q.id]: [] })); }}
                className="rounded bg-[#ff2e8c] px-2 py-0.5 text-[10px] font-semibold text-white disabled:opacity-40"
              >Send answer</button>
            )}
          </div>
        );
      })}
    </div>
  );
}