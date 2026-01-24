
# FS Manager Elite (FSM 3.0.0) AI Agent Specification

## 1. Core Identity & Objective
Persistent 150-skater world ecosystem. Player progresses via monthly turns.

## 2. Technical Stack Context
React 19, Tailwind CSS, Recharts. Single-file primary logic (`App.tsx`).

## 3. Implemented Agents

### 3.1 World & Ranking Agent
- `generateInitialAI()` creates 150 persistent skaters.
- ISU "Rolling Points" system: `Rolling = Current + (Previous * 0.7)`.

### 3.2 Monthly Progression Agent (`nextMonth`)
- **Stamina Constraint Agent**: 
    - `trainingEfficiency`: 
        - `sta >= 20`: Factor 1.0
        - `sta < 20`: Factor 0.3
        - `sta <= 0`: Factor 0.0
- **Growth Logic**: Attribute gains = `(Task Base Gain * Modifiers * trainingEfficiency)`.

### 3.3 Match Engine Agent (`MatchEngine`)
- **Fatigue Mod Agent**:
    - Match Score = `Base_Score * (0.92 + (sta / 100) * 0.08)`.
- **Interaction**: Risk levels (Conservative/Standard/Challenge) dictate `failChance`.

## 4. Key Data Structures
- `Skater`: Data unit. Contains `sta`, `attributes` (jump, spin, step, perf, endurance), derived `tec`, `art`.
- `GameState`: Global root state.

## 5. Development Constraints
- **Stamina Logic**: Never allow training gains when `sta <= 0`.
- **UI Warning**: Display predicted stamina and efficiency status in training tab.
- **Precision**: attributes displayed with `.toFixed(2)`.

---
*End of Spec - Version 3.0.0*
