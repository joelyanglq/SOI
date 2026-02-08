import { Sponsorship, Equipment, Coach } from '../types';
import { SURNAME, GIVEN, EQUIP_NAMES, CHOREO_NAMES } from './data/equipment';
import { COACHES } from './data/events';

// Sponsorship generation configs
const tierConfig = {
  local: {
    minFame: 0,
    baseSigningBonus: 3000,
    baseMonthlyPay: 800,
    baseLumpPerMonth: 1000,
    names: [
      "冰点奶茶", "城市咖啡馆", "鲜叶食品", "甜蜜面包坊", "汉堡小站",
      "城市之光健身", "动感滑冰场", "社区运动会", "阳光体育馆", "跨越瑜伽工作室",
      "蓝天护具", "冰雪装备店", "运动小铺", "飞速运动品牌", "极限体育用品",
      "时尚服饰坊", "冰洁美容", "魅力造型室", "本地裁缝铺", "运动着装馆",
      "社区便利店", "本地快递驿站", "家居生活馆", "数码维修铺", "医疗保健所"
    ]
  },
  brand: {
    minFame: 350,
    baseSigningBonus: 30000,
    baseMonthlyPay: 5000,
    baseLumpPerMonth: 6500,
    names: [
      "安踏体育", "李宁冰雪", "特步运动", "361度", "匹克体育", "乔丹体育", "鸿星尔克",
      "华为", "小米健康", "OPPO", "vivo", "联想", "TCL", "网易",
      "可口可乐", "百事可乐", "蒙牛乳业", "伊利乳业", "光明乳业", "王老吉", "六个核桃",
      "JACK & JONES", "H&M", "优衣库", "美邦", "森马", "太平鸟", "江南布衣",
      "长城汽车", "比亚迪", "吉利汽车", "五菱", "五羊本田",
      "平安保险", "人保财险", "工商银行", "中国银行", "建设银行",
      "暴雪娱乐", "腾讯游戏", "阿里巴巴", "京东", "美团", "滴滴出行"
    ]
  },
  global: {
    minFame: 1000,
    baseSigningBonus: 250000,
    baseMonthlyPay: 30000,
    baseLumpPerMonth: 38000,
    names: [
      "Rolex", "Omega", "Louis Vuitton", "Gucci", "Hermes", "Prada", "Dior", "Burberry",
      "Nike", "Adidas", "Puma", "New Balance", "Asics", "Mizuno", "Reebok",
      "Red Bull", "Monster Energy", "Coca-Cola", "Pepsi", "Gatorade", "Powerade",
      "Toyota", "Mercedes-Benz", "BMW", "Audi", "Porsche", "Ferrari", "Lamborghini", "Rolls-Royce",
      "Visa", "Mastercard", "American Express", "PayPal", "Stripe",
      "Samsung", "Apple", "Sony", "Microsoft", "Google", "Intel", "NVIDIA",
      "Nestle", "Unilever", "P&G", "Colgate-Palmolive", "L'Oreal",
      "Gatorade", "Under Armour", "North Face", "Columbia Sportswear", "Arc'teryx",
      "Uber", "Netflix", "Spotify", "Airbnb", "Hilton Hotels", "LVMH Group"
    ]
  }
} as const;

const durationOptions = [
  { months: 6, weight: 0.10 },
  { months: 12, weight: 0.35 },
  { months: 18, weight: 0.15 },
  { months: 24, weight: 0.28 },
  { months: 30, weight: 0.08 },
  { months: 36, weight: 0.04 }
];

const paymentTypeRoll = () => Math.random() > 0.6 ? 'lump-sum' as const : 'monthly' as const;

const weightedPick = <T extends { months?: number, weight?: number }>(arr: T[]) => {
  const total = arr.reduce((s, a) => s + (a.weight || 1), 0);
  let r = Math.random() * total;
  for (const a of arr) {
    const w = a.weight || 1;
    if (r < w) return a;
    r -= w;
  }
  return arr[arr.length - 1];
};

export const generateSponsorshipOptions = (fame: number): Sponsorship[] => {
  const options: Sponsorship[] = [];
  const tiers: Array<keyof typeof tierConfig> = ['local','brand','global'];
  for (let i = 0; i < 4; i++) {
    let tier: keyof typeof tierConfig = 'local';
    const roll = Math.random();
    if (fame > 1000 && roll > 0.50) tier = 'global';
    else if (fame > 300 && roll > 0.35) tier = 'brand';

    const cfg = tierConfig[tier];
    const name = cfg.names[Math.floor(Math.random() * cfg.names.length)];
    const durationPick = weightedPick(durationOptions) as { months: number };
    const duration = durationPick.months;
    const paymentType = paymentTypeRoll();
    const signingBonus = Math.floor(cfg.baseSigningBonus * (0.85 + Math.random() * 0.3));

    let monthlyPay: number | undefined = undefined;
    let totalPay: number | undefined = undefined;
    if (paymentType === 'monthly') {
      monthlyPay = Math.floor(cfg.baseMonthlyPay * (0.90 + Math.random() * 0.3));
    } else {
      totalPay = Math.floor(cfg.baseLumpPerMonth * duration * (0.85 + Math.random() * 0.3));
    }

    options.push({
      id: `sp_${Date.now()}_${i}_${Math.floor(Math.random()*1000)}`,
      name, tier, duration, remainingMonths: duration, paymentType, signingBonus,
      monthlyPay, totalPay, minFame: cfg.minFame
    });
  }
  return options;
};

export const generateRenewalOptions = (currentSponsor: Sponsorship): Sponsorship[] => {
  const renewalOptions: Sponsorship[] = [];
  const durations = [12, 24, 36];
  const discountRate = 0.85;
  for (const duration of durations) {
    const isLump = currentSponsor.paymentType === 'lump-sum';
    const cfg = tierConfig[currentSponsor.tier];
    const signing = Math.floor(currentSponsor.signingBonus * discountRate) + (duration > 12 ? 10000 : 0);
    if (isLump) {
      const total = currentSponsor.totalPay ? Math.floor(currentSponsor.totalPay * discountRate * (duration / currentSponsor.duration)) : Math.floor(cfg.baseLumpPerMonth * duration * discountRate);
      renewalOptions.push({
        id: `renewal_${Date.now()}_${duration}_${Math.floor(Math.random()*1000)}`,
        name: currentSponsor.name, tier: currentSponsor.tier, duration, remainingMonths: duration,
        paymentType: 'lump-sum', signingBonus: signing, totalPay: total,
        minFame: currentSponsor.minFame, isRenewal: true, discount: discountRate
      });
    } else {
      const monthly = currentSponsor.monthlyPay ? Math.floor(currentSponsor.monthlyPay * discountRate * (1 + (duration - currentSponsor.duration) * 0.01)) : Math.floor(cfg.baseMonthlyPay * discountRate);
      renewalOptions.push({
        id: `renewal_${Date.now()}_${duration}_${Math.floor(Math.random()*1000)}`,
        name: currentSponsor.name, tier: currentSponsor.tier, duration, remainingMonths: duration,
        paymentType: 'monthly', signingBonus: signing, monthlyPay: monthly,
        minFame: currentSponsor.minFame, isRenewal: true, discount: discountRate
      });
    }
  }
  return renewalOptions;
};

export const generateMarket = (activeCoachId: string | null = null, currentMarket: any = null) => {
  const newCoaches = COACHES.map(c => ({
    ...c,
    name: (SURNAME[Math.floor(Math.random() * SURNAME.length)] + "·" + GIVEN[Math.floor(Math.random() * GIVEN.length)])
  }));
  if (activeCoachId && currentMarket) {
    const activeOne = currentMarket.coaches.find((c: Coach) => c.id === activeCoachId);
    if (activeOne) newCoaches[0] = activeOne;
  }
  
  const equipment: Equipment[] = [
    { 
      id: 'skate_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.skate[Math.floor(Math.random() * EQUIP_NAMES.skate.length)], 
      type: 'skate', price: 2500, owned: false, lifespan: 12, maxLifespan: 12,
      jumpBonus: 3, spinBonus: 0, stepBonus: 1, perfBonus: 0, enduranceBonus: 2
    },
    { 
      id: 'blade_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.blade[Math.floor(Math.random() * EQUIP_NAMES.blade.length)], 
      type: 'blade', price: 5500, owned: false, lifespan: 10, maxLifespan: 10,
      jumpBonus: 1, spinBonus: 3, stepBonus: 2, perfBonus: 0, enduranceBonus: 0
    },
    { 
      id: 'costume_' + Math.random().toString(36).substr(2, 9), 
      name: EQUIP_NAMES.costume[Math.floor(Math.random() * EQUIP_NAMES.costume.length)], 
      type: 'costume', price: 15000, owned: false, lifespan: 8, maxLifespan: 8,
      jumpBonus: 0, spinBonus: 0, stepBonus: 1, perfBonus: 5, enduranceBonus: -1
    },
  ];

  const choreographers = [
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 5000, base: 45, desc: "富有情感深度的基础编排。" },
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 15000, base: 65, desc: "展现个人魅力的进阶构造。" },
    { name: CHOREO_NAMES[Math.floor(Math.random() * CHOREO_NAMES.length)], cost: 45000, base: 90, desc: "世界级的高难度艺术杰作。" }
  ];
  return { coaches: newCoaches, equipment, choreographers };
};
