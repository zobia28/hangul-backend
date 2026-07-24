// Server-authoritative question bank. The frontend should fetch questions
// from GET /api/topik/questions/:level rather than hardcoding them, so the
// correct answer index is never shipped to the client until scoring time.
const TOPIK_QUESTIONS = {
  I: [
    { id: "I-1", q: "다음 빈칸에 알맞은 것을 고르세요: 저는 학생___.", opts: ["이에요", "예요", "해요", "이야기"], answer: 0, skill: "grammar" },
    { id: "I-2", q: "'물' means:", opts: ["Fire", "Water", "Rice", "Book"], answer: 1, skill: "vocab" },
    { id: "I-3", q: "Listening: audio says a greeting. Which one did you hear?", opts: ["안녕하세요", "감사합니다", "죄송합니다", "미안해요"], answer: 0, skill: "listening", speak: "안녕하세요" },
    { id: "I-4", q: "Choose the correct word order: 저는 / 밥을 / 먹어요", opts: ["저는 밥을 먹어요", "밥을 먹어요 저는", "먹어요 저는 밥을", "밥을 저는 먹어요"], answer: 0, skill: "grammar" },
  ],
  II: [
    { id: "II-1", q: "빈칸에 알맞은 표현을 고르세요: 비가 ___ 집에 있어요.", opts: ["오면", "오지만", "오니까", "오는데"], answer: 0, skill: "grammar" },
    { id: "II-2", q: "'가지 않다' is closest in meaning to:", opts: ["to go", "to not go", "to arrive", "to leave quickly"], answer: 1, skill: "grammar" },
    { id: "II-3", q: "Listening: a short dialogue plays. What are they discussing?", opts: ["Weather", "Ordering food", "Directions", "Weekend plans"], answer: 3, skill: "listening", speak: "이번 주말에 뭐 할 거예요?" },
    { id: "II-4", q: "Reading: 저는 매일 아침 커피를 마셔요. What does the speaker drink every morning?", opts: ["Tea", "Water", "Coffee", "Juice"], answer: 2, skill: "reading" },
  ],
};

function publicQuestions(level) {
  const qs = TOPIK_QUESTIONS[level];
  if (!qs) return null;
  // Strip the answer index before sending to the client.
  return qs.map(({ answer, ...rest }) => rest);
}

function scoreAnswers(level, submittedAnswers) {
  // submittedAnswers: [{ id, chosen }]
  const qs = TOPIK_QUESTIONS[level];
  if (!qs) return null;

  let correctCount = 0;
  const skillBreakdown = {};

  qs.forEach((q) => {
    const submitted = submittedAnswers.find((a) => a.id === q.id);
    const correct = submitted && submitted.chosen === q.answer;
    if (correct) correctCount += 1;
    skillBreakdown[q.skill] = skillBreakdown[q.skill] || { correct: 0, total: 0 };
    skillBreakdown[q.skill].total += 1;
    if (correct) skillBreakdown[q.skill].correct += 1;
  });

  const total = qs.length;
  const score = Math.round((correctCount / total) * 100);
  return { correctCount, total, score, skillBreakdown };
}

module.exports = { TOPIK_QUESTIONS, publicQuestions, scoreAnswers };
