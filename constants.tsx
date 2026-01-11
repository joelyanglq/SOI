
import React from 'react';
import { Equipment, Coach, RandomEvent, Sponsorship, TrainingTaskDefinition } from './types';

export const MATCH_STAMINA_COST = 20;
export const TRAIN_MAX_GAIN = 2.0;
export const TRAIN_SD_RATIO = 0.5;
export const TRAIN_SD_MIN = 0.2;
export const SCORE_MIN = 0;
export const OLYMPIC_BASE_YEAR = 2026;
export const P_AGE_START = 6;
export const FATIGUE_SLOPE = 0.04;
export const FATIGUE_CAP = 0.85;
export const PCS_MIN = 0.15;

export const TRAINING_TASKS: Record<string, TrainingTaskDefinition> = {
  jump: { id: 'jump', name: '四周跳', color: 'bg-red-600', targetAttr: 'jump', baseGain: 1.0, staCost: 18, desc: "突破极限 (消耗大)" },
  spin: { id: 'spin', name: '柔韧旋转', color: 'bg-indigo-500', targetAttr: 'spin', baseGain: 0.8, staCost: 10, desc: "提升稳定与柔韧" },
  step: { id: 'step', name: '步法滑行', color: 'bg-cyan-600', targetAttr: 'step', baseGain: 0.8, staCost: 12, desc: "双修技术与艺术" },
  perf: { id: 'perf', name: '表现力', color: 'bg-purple-600', targetAttr: 'perf', baseGain: 0.9, staCost: 10, desc: "增强感染力 (PCS)" },
  endurance: { id: 'endurance', name: '核心耐力', color: 'bg-amber-600', targetAttr: 'endurance', baseGain: 0.7, staCost: 15, desc: "抗疲劳与减耗" },
  rest: { id: 'rest', name: '深度理疗', color: 'bg-slate-700', baseGain: 0, staCost: -25, desc: "恢复大量体力" }
};

export const LOADING_QUOTES = [
  "正在打磨冰刀，极致的锋利是稳定的基础。",
  "四周跳不仅是技术，更是对地心引力的宣战。",
  "你知道吗？一场高强度的自由滑消耗的能量相当于跑完十公里。",
  "考斯滕上的每一颗水钻，都是选手个性的延伸。",
  "正在清理冰面，好的冰面才能做出完美的接续步。",
  "教练正在场边喝咖啡，顺便观察你的用刃是否准确。",
  "音乐响起前的那一秒，全世界都是安静的。",
  "摔倒并不可怕，可怕的是不敢再次起跳。",
  "选手在冰上的每一次旋转，都是对时间和空间的挑战。",
  "冰面反射的光芒，是对努力最温柔的奖赏。",
  "连跳前的那一瞬间，心跳和呼吸都像节拍器一样精准。",
  "舞步的每一次滑行，都在讲述一个关于坚持的故事。",
  "训练的汗水，最终都会在比赛的光芒中闪耀。",
  "冰刀划过的痕迹，是短暂却美丽的艺术线条。",
  "心理稳定比技术动作更难掌控，但同样重要。",
  "每一次完美的落冰，都是对训练日复一日的回报。",
  "裁判打分的瞬间，你会感受到冰上努力的重量。",
  "准备起跳时，请想象风都在为你让路。",
  "每一次旋转结束的平衡，都是对力量和柔韧的考验。",
  "冰场上的每一分每一秒，都在为下一次精彩铺路。"
];

// 本地解说语料库（扩展版）
export const COMMENTARY_CORPUS = {
  gold: [
    "完美无瑕！这不仅仅是一场比赛，更是一场冰上的史诗级演出！",
    "全场起立鼓舞！我们见证了一个新传奇的诞生，这枚金牌实至名归。",
    "每一个跳跃都像精确的钟表一样准确，今晚的冰场属于你！",
    "裁判打出了惊人的高分！这套节目将被载入花滑史册。",
    "你是冰面上的主宰，这种统治力让对手感到绝望。",
    "旋转如同风中飞舞的叶子，动作流畅到每一帧都令人屏息。",
    "每一次跳跃都充满力量与艺术的完美结合，堪称教科书级表现。",
    "今晚，你不仅赢得了分数，更赢得了观众的心。"
  ],
  podium: [
    "非常稳健的发挥，领奖台上已经为你留好了位置。",
    "虽然有一点点小瑕疵，但整体的艺术感染力征服了全场。",
    "这是一场高水平的较量，你证明了自己属于世界顶尖行列。",
    "极其富有张力的表演，这枚奖牌是对你刻苦训练的最好回报。",
    "你的滑行如丝般顺滑，恭喜你再次站在了聚光灯中心。",
    "每一个动作都充满自信，你的努力已经得到应有的认可。",
    "稳中带美的演出，让人忍不住为你的未来充满期待。",
    "这枚奖牌不仅是成绩的象征，更是坚持与激情的结晶。"
  ],
  mid: [
    "中规中矩的演出，虽然没有大错，但也缺乏一些亮眼的爆点。",
    "基本完成了预定的难度，但艺术分的潜力还有待进一步挖掘。",
    "在强手如林的比赛中保持了这个位次，是一个扎实的进步。",
    "体能似乎在后半程有所下滑，但核心动作都保住了，继续努力！",
    "这是一次宝贵的经验，你已经离顶级梯队越来越近了。",
    "动作完成度一般，但表现力仍然可圈可点，继续磨练细节。",
    "小小的失误未能掩盖整体节目的完整性，值得肯定。",
    "每一次落冰和旋转都在积累经验，为下一场比赛打下基础。"
  ],
  low: [
    "今天似乎不在状态，几次跳跃的落冰都显得有些挣扎。",
    "比赛就是这样有起有伏，不要因为一次的失利而否定自己的努力。",
    "冰面今天对你来说似乎有些滑，没关系，回去调整好心态再出发。",
    "技术动作出现了严重失误，但你坚持完成了比赛，这份韧性值得尊重。",
    "下一次，我们会以更强的姿态回到这个冰场。",
    "动作连贯性不足，但你在努力把控节奏，这是成长的一部分。",
    "精神状态稍显紧张，但整体完成度还算稳妥，继续打磨。",
    "今天的表现提醒我们，比赛不仅仅是技巧，更是心理和策略的较量。"
  ]
};


// 事件描述语料库
export const EVENT_NARRATIVES: Record<string, string[]> = {
  ev_fan_letter: [
    "清晨，训练场门口堆满了五颜六色的信封，每一封都承载着冰迷的爱。",
    "你读着那些笔触稚嫩的鼓励信，感觉训练的疲劳瞬间烟消云散。"
  ],
  ev_ice_quality: [
    "冰场管理员今天心情大好，把冰面浇得像镜子一样完美。",
    "当冰刀划过刚浇好的冰面，那种无阻力的快感让你沉醉。"
  ],
  ev_stretch: [
    "瑜伽老师的‘折磨’虽然让你惨叫连连，但身体确实变得轻盈了许多。",
    "每一次拉伸都在突破极限，你的动作线条变得更加优美动人。"
  ],
  ev_night_practice: [
    "黑暗中只有一束聚光灯，你在寂静中完成了无数次起跳。",
    "凌晨三点的冰场很冷，但你内心的火焰烧得正旺。"
  ],
  ev_viral_video: [
    "你在练习时的神级落冰被路人拍下，点赞量瞬间突破了百万！",
    "一夜之间，你成了社交媒体上的‘冰上精灵’，私信被塞满了。"
  ],
  ev_bad_sleep: [
    "时钟滴答作响，比赛的压力让你在床上翻来覆去无法入眠。",
    "带着黑眼圈踏上冰场，感觉双腿像灌了铅一样沉重。"
  ],
  ev_major_injury: [
    "冰场上响起了清脆的一声，随后是钻心的疼痛。所有人都围了过来...",
    "医生的诊断证明像一张沉重的判决书，你不得不暂时告别心爱的冰场。"
  ],
  ev_masterclass: [
    "曾经的奥运冠军指着你的用刃点拨了几句，让你瞬间茅塞顿开。",
    "那种只有顶级选手才懂的‘冰感’，在这一刻传达到了你的心中。"
  ]
};

export const COACHES: Coach[] = [
  { id: 'coach_1', name: '基础教练', tecMod: 1.0, artMod: 1.0, salary: 1000, tier: 'basic' },
  { id: 'coach_2', name: '专业教练', tecMod: 1.25, artMod: 1.15, salary: 3500, tier: 'pro' },
  { id: 'coach_3', name: '国家级教练', tecMod: 1.4, artMod: 1.4, salary: 8000, tier: 'pro' },
  { id: 'coach_4', name: '传奇教练', tecMod: 1.7, artMod: 1.8, salary: 20000, tier: 'legend' },
];

export const RANDOM_EVENTS: RandomEvent[] = [
  { id: 'ev_fan_letter', name: '冰迷的鼓励', description: '收到了一大叠来自世界各地冰迷的信件，心情大好。', chance: 0.5, isRare: false, type: 'positive', effect: { sta: 10, fame: 2 } },
  { id: 'ev_ice_quality', name: '完美冰面', description: '今天的冰场刚刚浇过冰，滑行感觉从未如此丝滑。', chance: 0.4, isRare: false, type: 'positive', effect: { tec: 0.5, art: 0.2 } },
  { id: 'ev_stretch', name: '深度瑜伽课', description: '在教练的建议下参加了高强度拉伸，身体柔韧性有所提升。', chance: 0.4, isRare: false, type: 'positive', effect: { art: 0.8, sta: -5 } },
  { id: 'ev_night_practice', name: '深夜加练', description: '灯光熄灭后的冰场只有你一人，这一晚你的跳跃格外稳定。', chance: 0.3, isRare: false, type: 'positive', effect: { tec: 1.0, sta: -15 } },
  { id: 'ev_music_insp', name: '旋律灵感', description: '在漫步时听到一段旋律，突然对节目的表现力有了新感悟。', chance: 0.3, isRare: false, type: 'positive', effect: { art: 1.2 } },
  { id: 'ev_local_news', name: '地方媒体报道', description: '当地体育报纸对你进行了专访。', chance: 0.3, isRare: false, type: 'positive', effect: { fame: 5, money: 1000 } },
  { id: 'ev_bad_sleep', name: '赛前焦虑', description: '持续失眠导致训练时精神难以集中，感觉身体异常沉重。', chance: 0.4, isRare: false, type: 'negative', effect: { sta: -20, tec: -0.3 } },
  { id: 'ev_blade_dull', name: '冰刀变钝', description: '训练中发现冰刀由于磨损失去了抓地力，几个动作出现了失误。', chance: 0.3, isRare: false, type: 'negative', effect: { tec: -0.8, money: -500 } },
  { id: 'ev_cold', name: '突发感冒', description: '换季期间不慎感冒，只能带病坚持训练。', chance: 0.3, isRare: false, type: 'negative', effect: { sta: -25, tec: -1.0 } },
  { id: 'ev_costume_rip', name: '服装损坏', description: '考斯滕在试穿时意外勾破，修补费用不菲。', chance: 0.2, isRare: false, type: 'negative', effect: { art: -0.5, money: -2000 } },
  { id: 'ev_nutrition', name: '饮食违规', description: '一时没忍住吃了油腻食物，体重微增影响了起跳。', chance: 0.3, isRare: false, type: 'negative', effect: { tec: -0.4, sta: -10 } },
  { id: 'ev_sponsor_watch', name: '奢侈品代言', description: '顶级腕表品牌决定签下你作为他们的冰上大使。', chance: 0.05, isRare: true, type: 'positive', effect: { money: 60000, fame: 80 } },
  { id: 'ev_major_injury', name: '严重扭伤', description: '在尝试高难度跳跃时落地不稳，脚踝发出了令人不安的声音。', chance: 0.03, isRare: true, type: 'negative', effect: { tec: -8, art: -3, injuryMonths: 4 } },
  { id: 'ev_viral_video', name: '短视频爆火', description: '你的训练视频配上热门乐曲在社交媒体疯狂传播，粉丝数激增。', chance: 0.08, isRare: true, type: 'positive', effect: { fame: 150, money: 8000 } },
  { id: 'ev_masterclass', name: '传奇大师课', description: '一位退役的奥运冠军偶然路过冰场，给了你一些终身受用的点拨。', chance: 0.04, isRare: true, type: 'positive', effect: { tec: 4.0, art: 4.0 } },
  { id: 'ev_equipment_failure', name: '冰鞋断裂', description: '使用了很久的冰鞋在落地时彻底断裂，这对新赛季是巨大的打击。', chance: 0.02, isRare: true, type: 'negative', effect: { tec: -3.0, money: -5000, sta: -15 } },
  { id: 'ev_mental_breakthrough', name: '心境突破', description: '你终于克服了对四周跳的恐惧，在心理上跨出了一大步。', chance: 0.06, isRare: true, type: 'positive', effect: { tec: 5.0, art: 2.0 } },
];

export const SURNAME = [
  // 中文姓
  "金","陈","刘","王","李","张","赵","彭","朱","闫","隋","何","林","杨","高","周","郑","胡","蒋","吴","孙","徐","曹","董","韩","赖","冯","曾","姚","范","方","谢","许","邓",
  // 日本姓
  "宇野","羽生","键山","宫原","本田","纪平","三宅","佐藤","坂本","小林","高桥","村元","樋口","中野","加藤","铃木","田中","松本","森","山本","吉田","石川","川口","清水","藤井",
  // 俄罗斯姓
  "谢尔巴科娃","特鲁索娃","瓦利耶娃","图克塔米舍娃","科斯托娜娅","扎吉托娃","普鲁申科","伊格纳托娃","卡萨托诺娃","库兹涅佐娃","帕夫柳琴科","萨夫琴科","舒斯托娃","奥布拉佐娃",
  // 欧洲/美洲姓
  "戈尔德","哈贝尔","费尔南德斯","帕帕达吉斯","布朗","拜尔斯","内森","文森特","麦迪逊","凯文","哈维尔","约翰逊","史密斯","威尔逊","泰勒","安德森","乔治","亚当斯","克里斯蒂","霍尔"
];

export const GIVEN = [
  // 中文名
  "博洋","巍","一帆","子涵","天一","梦洁","文静","聪","程","梨花","俊焕","诗涵","佳宁","雨辰","依然","思远","子墨","若水","欣怡","睿","嘉豪","晓琳","梓涵","思琪","佳琦","浩然","俊杰","婉婷","文轩","晓东",
  // 日本名
  "昌磨","结弦","优真","花织","真央","舞","樱","光","翔","步","健","奈","葵","大翔","海斗","凉介","瑞希","仁美","和也","悠人","悠真","爱菜","由纪","彩花","理沙","遥","琴音","葵","直人","蓮",
  // 俄罗斯名
  "安娜","伊利亚","亚历山德拉","伊丽莎白","玛丽亚","叶卡捷琳娜","丹尼尔","米哈伊尔","奥列格","维克多","斯维特拉娜","娜塔莉亚","尤里","奥尔加","阿列克谢","瓦伦丁","伊戈尔","安德烈","伊琳娜","索菲亚","尤利娅","安东","列夫","妮可","丹娜","米拉","奥克萨娜","尼基塔",
  // 欧美名
  "内森","文森特","麦迪逊","哈维尔","凯文","约翰","艾米丽","莎拉","克里斯","丹尼尔","莉莉","本杰明","亚当","艾伦","奥利维亚","詹姆斯","露西","查理","艾玛","伊桑","汉娜","索菲","亨利","伊莎贝拉","索尔","克莱尔","诺亚","莱拉","亚历克斯","丽贝卡","杰森"
];

export const CITIES = ["北京", "上海", "东京", "巴黎", "莫斯科", "纽约", "米兰", "首尔", "温哥华"];
export const REGIONS = ["东亚", "欧洲", "北美", "大洋洲"];

export const EQUIP_NAMES = {
  skate: ["冰鞋", "专业靴", "定制皮靴", "钛金支撑靴"],
  blade: ["冰刀", "碳纤维钢刀", "黄金利刃", "极光之刃"],
  costume: ["考斯滕", "演出服", "高定华服", "丝绸战衣"]
};

export const CHOREO_NAMES = [
  "一步之遥", "月光", "黑天鹅", "图兰朵", "辛德勒名单",
  "秋日私语", "歌剧魅影", "波莱罗", "冬", "春之祭",
  "天鹅湖", "卡门", "蓝色多瑙河", "红与黑", "梦幻旋律",
  "夜的钢琴曲", "黎明前的舞步", "孤独的旅人", "冰雪奇缘", "夜空之歌",
  "风之影", "星河彼岸", "深海之心", "烈焰之舞", "流光溢彩",
  "镜中花", "落叶归根", "流沙", "樱花纷飞", "幽灵圆舞曲",
  "黑夜序曲", "晨曦的呼吸", "黄昏的旋律", "云端之舞", "梦境漫步",
  "水墨情缘", "极光之恋", "雪夜交响", "海潮之歌", "暗香浮动",
  "静谧时光", "焰火与冰霜"
];
