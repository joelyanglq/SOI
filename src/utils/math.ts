export const randNormal = (mean = 0, sd = 1) => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sd + mean;
};

export const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
