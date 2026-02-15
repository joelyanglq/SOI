import { RandomEvent, PressQuestion, PressAnswer, PressReporter, PressMediaType, HiddenStatsDelta } from '../types';
import { COMMENTARY_CORPUS, EVENT_NARRATIVES, REPORTERS_POOL, PRESS_QUESTIONS, PRESS_ANSWER_TEMPLATES, PRESS_MEDIA_BY_LEVEL, QUESTION_COUNT_BY_LEVEL } from '../data/text';
import { clamp } from '../utils/math';

export const generateLocalCommentary = (rank: number) => {
  let pool = COMMENTARY_CORPUS.mid;
  if (rank === 1) pool = COMMENTARY_CORPUS.gold;
  else if (rank <= 3) pool = COMMENTARY_CORPUS.podium;
  else if (rank > 10) pool = COMMENTARY_CORPUS.low;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const generateLocalNarrative = (event: RandomEvent) => {
  const pool = EVENT_NARRATIVES[event.id];
  return (pool && pool.length > 0) ? pool[Math.floor(Math.random() * pool.length)] : event.description;
};

// Press Conference Functions
const getRandomReporters = (level: 'low' | 'mid' | 'high'): PressReporter[] => {
  const mediaTypes = PRESS_MEDIA_BY_LEVEL[level];
  const available = REPORTERS_POOL.filter(r => mediaTypes.includes(r.media));
  
  const count = Math.min(mediaTypes.length, available.length);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, count).map((r, i) => ({
    ...r,
    id: `reporter_${i}_${Date.now()}`
  }));
};

const getAnswerOptions = (tone: 'confident' | 'humble' | 'honest' | 'aggressive'): PressAnswer[] => {
  const templates = PRESS_ANSWER_TEMPLATES[tone];
  return templates.map(t => ({
    ...t,
    tone,
  }));
};

const selectAnswersForQuestion = (): PressAnswer[] => {
  const allAnswers: PressAnswer[] = [];
  
  ['confident', 'humble', 'honest'].forEach(tone => {
    const answers = getAnswerOptions(tone as 'confident' | 'humble' | 'honest');
    allAnswers.push(answers[Math.floor(Math.random() * answers.length)]);
  });
  
  return allAnswers;
};

export const generatePressConference = (
  rank: number,
  hasFall: boolean,
  tec: number,
  art: number,
  mental: number,
  stress: number,
  publicScore: number,
  eventLevel: 'low' | 'mid' | 'high'
): PressQuestion[] => {
  const reporters = getRandomReporters(eventLevel);
  const questionCount = QUESTION_COUNT_BY_LEVEL[eventLevel];
  const totalQuestions = questionCount.min + Math.floor(Math.random() * (questionCount.max - questionCount.min + 1));
  
  const questions: PressQuestion[] = [];
  const usedQuestions = new Set<string>();
  
  // 1. 必选问题：根据比赛结果
  let primaryCategory: keyof typeof PRESS_QUESTIONS;
  if (rank === 1) {
    primaryCategory = 'gold';
  } else if (hasFall) {
    primaryCategory = 'fail';
  } else {
    primaryCategory = 'general';
  }
  
  const primaryPool = PRESS_QUESTIONS[primaryCategory];
  const primaryQ = primaryPool[Math.floor(Math.random() * primaryPool.length)];
  usedQuestions.add(primaryQ);
  
  questions.push({
    id: `q_primary_${Date.now()}`,
    reporter: reporters[0],
    text: primaryQ,
    answers: selectAnswersForQuestion(),
  });
  
  // 2. 属性相关问题 (TEC vs ART)
  if (tec > art + 10 && questions.length < totalQuestions) {
    const techPool = PRESS_QUESTIONS.tech;
    const q = techPool[Math.floor(Math.random() * techPool.length)];
    if (!usedQuestions.has(q)) {
      questions.push({
        id: `q_tech_${Date.now()}`,
        reporter: reporters[questions.length % reporters.length],
        text: q,
        answers: selectAnswersForQuestion(),
      });
    }
  } else if (art > tec + 10 && questions.length < totalQuestions) {
    const artPool = PRESS_QUESTIONS.art;
    const q = artPool[Math.floor(Math.random() * artPool.length)];
    if (!usedQuestions.has(q)) {
      questions.push({
        id: `q_art_${Date.now()}`,
        reporter: reporters[questions.length % reporters.length],
        text: q,
        answers: selectAnswersForQuestion(),
      });
    }
  }
  
  // 3. 隐藏属性相关问题
  const hiddenCategories: { key: keyof typeof PRESS_QUESTIONS; condition: boolean }[] = [
    { key: 'mental', condition: mental < 40 },
    { key: 'stress', condition: stress > 60 },
    { key: 'public', condition: publicScore < 30 },
  ];
  
  for (const hidden of hiddenCategories) {
    if (questions.length >= totalQuestions) break;
    if (hidden.condition) {
      const pool = PRESS_QUESTIONS[hidden.key];
      const q = pool[Math.floor(Math.random() * pool.length)];
      if (!usedQuestions.has(q)) {
        questions.push({
          id: `q_${hidden.key}_${Date.now()}`,
          reporter: reporters[questions.length % reporters.length],
          text: q,
          answers: selectAnswersForQuestion(),
        });
      }
    }
  }
  
  // 4. 媒体专属问题 (高级赛事)
  if (eventLevel === 'high' && questions.length < totalQuestions) {
    const entPool = PRESS_QUESTIONS.entertainment;
    const q = entPool[Math.floor(Math.random() * entPool.length)];
    if (!usedQuestions.has(q)) {
      questions.push({
        id: `q_ent_${Date.now()}`,
        reporter: reporters.find(r => r.media === 'entertainment') || reporters[0],
        text: q,
        answers: selectAnswersForQuestion(),
      });
    }
  }
  
  // 5. 通用填充问题
  while (questions.length < totalQuestions) {
    const generalPool = PRESS_QUESTIONS.general;
    const q = generalPool[Math.floor(Math.random() * generalPool.length)];
    if (!usedQuestions.has(q)) {
      questions.push({
        id: `q_gen_${Date.now()}`,
        reporter: reporters[questions.length % reporters.length],
        text: q,
        answers: selectAnswersForQuestion(),
      });
    }
  }
  
  return questions;
};

export const applyPressEffect = (
  currentStats: { mental: number; stress: number; public: number },
  answer: PressAnswer['effects']
): HiddenStatsDelta => {
  const delta = {
    mental: answer.mental || 0,
    stress: answer.stress || 0,
    public: answer.public || 0,
  };
  
  return {
    mental: clamp(currentStats.mental + delta.mental, 0, 100),
    stress: clamp(currentStats.stress + delta.stress, 0, 100),
    public: clamp(currentStats.public + delta.public, 0, 100),
  };
};
