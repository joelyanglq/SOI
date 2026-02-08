import { RandomEvent, Coach } from '../../types';

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'ev_fan_letter', name: '冰迷的鼓励', description: '收到了一大叠来自世界各地冰迷的信件，心情大好。', chance: 0.5, isRare: false, type: 'positive', effect: { sta: 10, fame: 2 } },
  { id: 'ev_ice_quality', name: '完美冰面', description: '今天的冰场刚刚浇过冰，滑行感觉从未如此丝滑。', chance: 0.4, isRare: false, type: 'positive', effect: { jump: 1, step: 2 } },
  { id: 'ev_stretch', name: '深度瑜伽课', description: '在教练的建议下参加了高强度拉伸，身体柔韧性有所提升。', chance: 0.4, isRare: false, type: 'positive', effect: { spin: 2, perf: 1, sta: -5 } },
  { id: 'ev_night_practice', name: '深夜加练', description: '灯光熄灭后的冰场只有你一人，这一晚你的跳跃格外稳定。', chance: 0.3, isRare: false, type: 'positive', effect: { jump: 3, sta: -15 } },
  { id: 'ev_music_insp', name: '旋律灵感', description: '在漫步时听到一段旋律，突然对节目的表现力有了新感悟。', chance: 0.3, isRare: false, type: 'positive', effect: { perf: 3 } },
  { id: 'ev_local_news', name: '地方媒体报道', description: '当地体育报纸对你进行了专访。', chance: 0.3, isRare: false, type: 'positive', effect: { fame: 5, money: 1000 } },
  { id: 'ev_bad_sleep', name: '赛前焦虑', description: '持续失眠导致训练时精神难以集中，感觉身体异常沉重。', chance: 0.4, isRare: false, type: 'negative', effect: { sta: -20, endurance: -2 } },
  { id: 'ev_blade_dull', name: '冰刀变钝', description: '训练中发现冰刀由于磨损失去了抓地力，几个动作出现了失误。', chance: 0.3, isRare: false, type: 'negative', effect: { jump: -2, step: -1, money: -500 } },
  { id: 'ev_cold', name: '突发感冒', description: '换季期间不慎感冒，只能带病坚持训练。', chance: 0.3, isRare: false, type: 'negative', effect: { sta: -25, endurance: -3 } },
  { id: 'ev_costume_rip', name: '服装损坏', description: '考斯滕在试穿时意外勾破，修补费用不菲。', chance: 0.2, isRare: false, type: 'negative', effect: { perf: -2, money: -2000 } },
  { id: 'ev_nutrition', name: '饮食违规', description: '一时没忍住吃了油腻食物，体重微增影响了起跳。', chance: 0.3, isRare: false, type: 'negative', effect: { jump: -1, endurance: -1, sta: -10 } },
  { id: 'ev_sponsor_watch', name: '奢侈品代言', description: '顶级腕表品牌决定签下你作为他们的冰上大使。', chance: 0.05, isRare: true, type: 'positive', effect: { money: 60000, fame: 80 } },
  { id: 'ev_major_injury', name: '严重扭伤', description: '在尝试高难度跳跃时落地不稳，脚踝发出了令人不安的声音。', chance: 0.03, isRare: true, type: 'negative', effect: { jump: -5, step: -5, injuryMonths: 4 } },
  { id: 'ev_viral_video', name: '短视频爆火', description: '你的训练视频配上热门乐曲在社交媒体疯狂传播，粉丝数激增。', chance: 0.08, isRare: true, type: 'positive', effect: { fame: 150, money: 8000 } },
  { id: 'ev_masterclass', name: '传奇大师课', description: '一位退役的奥运冠军偶然路过冰场，给了你一些终身受用的点拨。', chance: 0.04, isRare: true, type: 'positive', effect: { jump: 3, spin: 3, step: 3, perf: 3 } },
  { id: 'ev_equipment_failure', name: '冰鞋断裂', description: '使用了很久的冰鞋在落地时彻底断裂，这对新赛季是巨大的打击。', chance: 0.02, isRare: true, type: 'negative', effect: { jump: -4, step: -2, money: -5000, sta: -15 } },
  { id: 'ev_mental_breakthrough', name: '心境突破', description: '你终于克服了对四周跳的恐惧，在心理上跨出了一大步。', chance: 0.06, isRare: true, type: 'positive', effect: { jump: 5, perf: 3 } },
];

export const COACHES: Coach[] = [
  { id: 'coach_1', name: '基础教练', tecMod: 1.0, artMod: 1.0, salary: 1000, tier: 'basic' },
  { id: 'coach_2', name: '专业教练', tecMod: 1.25, artMod: 1.15, salary: 3500, tier: 'pro' },
  { id: 'coach_3', name: '国家级教练', tecMod: 1.4, artMod: 1.4, salary: 8000, tier: 'pro' },
  { id: 'coach_4', name: '传奇教练', tecMod: 1.7, artMod: 1.8, salary: 20000, tier: 'legend' },
];
