import { RandomEvent } from '../types';
import { COMMENTARY_CORPUS, EVENT_NARRATIVES } from '../data/text';

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
