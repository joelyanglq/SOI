在 FS Manager Elite 中，比赛得分系统（Match Engine）由 技术分 (TES)、节目内容分 (PCS) 以及 修正系数 (Modifiers) 三部分组成。
以下是详细的计算公式及逻辑注释：
1. 玩家选手得分公式 (Player Scoring)
玩家的总分计算遵循以下链路：
A. 技术分 (TES - Technical Element Score)
EventBase: 赛事的难度基数（如挑战赛 35，奥运会 140）。
RiskBonus: 风险收益。根据选择的策略（保守/标准/挑战）增加固定分值（
）。
TEC 
 0.9: 选手技术属性的直接产出权重。
Random(0, 15): 比赛现场发挥的微小随机波动。
B. 节目内容分 (PCS - Program Components Score)
ART 
 1.1: 选手艺术属性的产出权重。
ProgramBaseArt: 当前节目的编排底蕴（由编舞家决定，45-90不等）。
FreshnessMod: 节目新鲜度修正。公式为 Math.max(0.4, Freshness / 100)。节目参赛次数越多，新鲜度越低，该系数最低会降至 0.4（即艺术分损失 60%）。
C. 修正系数与惩罚 (Modifiers)
FallPenalty (失误惩罚):
触发概率 FailChance: clamp(Risk * 50 - TEC * 0.4, 5, 95)。风险越高、技术越低，摔倒概率越大。
若判定为 Fail（摔倒）：TES 将直接乘 0.6（扣除 40%）。
StaminaFactor (体力修正系数):
公式：0.92 + (CurrentSTA / 100) * 0.08。
影响：体力全满（100）时系数为 1.0；体力耗尽（0）时系数为 0.92。这意味着疲劳会导致最终总分损失最高 8%。
2. AI 选手得分公式 (AI Scoring)
AI 选手的计算相对简化，主要为了模拟其稳定的等级表现：
属性权重: AI 的技术权重（0.85）和艺术权重（0.75）略低于玩家，以补偿 AI 不受体力、新鲜度和摔倒惩罚的直接计算。
Variation (随机扰动): 0.95 + Math.random() * 0.05。模拟 AI 选手的临场状态起伏（±5%）。
3. 模拟比赛排名公式 (AI Monthly Simulation)
当玩家不在场（下个月逻辑）时，系统为了维持世界排名稳定，对 AI 之间的对决使用了另一套基于段位的偏差计算：
BiasedMean (期望名次): (MaxParticipants * SkillFactor * 0.7) + 1
SkillFactor: (200 - (TEC + ART)) / 200。
Rank: clamp(randNormal(BiasedMean, MaxParticipants * 0.15), 1, Max)
逻辑：属性总和越高（越接近200），BiasedMean 越接近 1。通过正态分布随机数，确保高属性选手在模拟中大概率获得前几名，从而维持高积分。