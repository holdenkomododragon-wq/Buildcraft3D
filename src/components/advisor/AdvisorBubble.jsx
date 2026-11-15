import AdvisorQuestions from './AdvisorQuestions';
import AdvisorRecommendation from './AdvisorRecommendation';

export default function AdvisorBubble({ msg, isLast, disabled, onAnswer, onApply }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg rounded-br-sm border border-[#00cc66]/30 bg-[#00cc66]/10 px-3 py-2 text-[12px] leading-relaxed text-[#f1c40f]">{msg.content}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5f5f68]">Advisor</p>
      {msg.content ? (
        <p className="max-w-[92%] whitespace-pre-line rounded-lg rounded-bl-sm border border-[#232323] bg-[#161616] px-3 py-2 text-[12.5px] leading-relaxed text-[#d4d4d8]">{msg.content}</p>
      ) : null}
      {isLast && msg.questions && msg.questions.length ? (
        <AdvisorQuestions questions={msg.questions} disabled={disabled} onAnswer={onAnswer} />
      ) : null}
      {msg.build && msg.build.length ? (
        <AdvisorRecommendation build={msg.build} total={msg.total} notes={msg.notes || []} fit={msg.fit} fps={msg.fps} onApply={onApply} canApply={isLast} />
      ) : null}
    </div>
  );
}