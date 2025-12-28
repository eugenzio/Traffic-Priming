# Research Data Collection Guide

## 📊 논문 작성을 위한 새로운 데이터 필드

이 가이드는 논문 작성에 필수적인 추가 데이터 필드들을 설명합니다.

---

## 🆕 추가된 데이터 필드 (2025-12-28)

### 1. **Error Type Classification** (에러 타입 분류)

**필드**: `error_type`
**타입**: `'conservative_error' | 'risky_error' | 'correct_go' | 'correct_nogo'`

**설명**: Signal Detection Theory 분석을 위한 응답 분류

| 값 | 의미 | 논문에서의 중요성 |
|---|---|---|
| `correct_go` | 정답: 좌회전해야 하고 좌회전함 | Hit rate |
| `correct_nogo` | 정답: 대기해야 하고 대기함 | Correct rejection rate |
| `conservative_error` | 오답: 좌회전해야 하는데 대기함 | Miss (Type II error) - 보수적 오류 |
| `risky_error` | 오답: 대기해야 하는데 좌회전함 | False Alarm (Type I error) - 위험한 오류 |

**분석 예시**:
```sql
-- 그룹별 에러 타입 분포
SELECT
  priming_group,
  error_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY priming_group), 2) as percentage
FROM trial_logs
WHERE priming_group IS NOT NULL AND error_type IS NOT NULL
GROUP BY priming_group, error_type
ORDER BY priming_group, error_type;
```

**논문 활용**:
- **RQ1**: Group A(Urgency)가 더 많은 risky_error를 유발하는가?
- **RQ2**: Group B(Safety)가 conservative_error를 증가시키는가?
- **SDT Analysis**: d'(sensitivity)와 c(criterion) 계산

---

### 2. **Global Trial Number** (전체 시행 번호)

**필드**: `trial_number_global`
**타입**: `number` (1, 2, 3, ... 21)

**설명**: 전체 실험에서의 절대적 시행 순서

**분석 예시**:
```sql
-- 학습 효과 분석
SELECT
  CASE
    WHEN trial_number_global BETWEEN 1 AND 7 THEN 'Early (1-7)'
    WHEN trial_number_global BETWEEN 8 AND 14 THEN 'Middle (8-14)'
    ELSE 'Late (15-21)'
  END as phase,
  AVG(correct) as accuracy,
  AVG(rt_ms) as avg_rt
FROM trial_logs
WHERE trial_number_global IS NOT NULL
GROUP BY phase
ORDER BY phase;
```

**논문 활용**:
- **Learning Effects**: 시행이 진행됨에 따라 정확도가 향상되는가?
- **Fatigue Effects**: 후반부에 RT가 증가하거나 정확도가 감소하는가?
- **Interaction**: 프라이밍 효과가 시간에 따라 변하는가?

---

### 3. **Trials Since Priming** (프라이밍 후 경과 시행 수)

**필드**: `trials_since_priming`
**타입**: `number` (0, 1, 2, ... N)

**설명**: 프라이밍 화면 본 후 몇 번째 시행인지 (0 = 프라이밍 직후 첫 시행)

**분석 예시**:
```sql
-- 프라이밍 효과 감쇠 분석
SELECT
  priming_group,
  CASE
    WHEN trials_since_priming BETWEEN 0 AND 5 THEN 'Immediate (0-5)'
    WHEN trials_since_priming BETWEEN 6 AND 10 THEN 'Delayed (6-10)'
    ELSE 'Late (11+)'
  END as time_window,
  AVG(CASE WHEN error_type = 'risky_error' THEN 1 ELSE 0 END) as risky_error_rate,
  COUNT(*) as n_trials
FROM trial_logs
WHERE priming_group IS NOT NULL AND trials_since_priming IS NOT NULL
GROUP BY priming_group, time_window
ORDER BY priming_group, time_window;
```

**논문 활용**:
- **Temporal Decay**: 프라이밍 효과가 시간에 따라 약화되는가?
- **Critical Window**: 효과가 가장 강한 시간 구간은?
- **Group Differences**: 그룹별로 효과 지속 시간이 다른가?

---

### 4. **Time Since Priming (ms)** (프라이밍 후 경과 시간)

**필드**: `time_since_priming_ms`
**타입**: `number` (밀리초)

**설명**: 프라이밍 화면 본 후 실제 경과 시간 (ms)

**분석 예시**:
```sql
-- 시간 기반 프라이밍 효과 분석
SELECT
  priming_group,
  ROUND(time_since_priming_ms / 1000.0 / 60.0) as minutes_since_priming,
  AVG(correct) as accuracy
FROM trial_logs
WHERE time_since_priming_ms IS NOT NULL
GROUP BY priming_group, minutes_since_priming
ORDER BY priming_group, minutes_since_priming;
```

**논문 활용**:
- **Time-based Analysis**: 시행 수 대신 실제 경과 시간 기준 분석
- **Individual Differences**: 빠른 응답자 vs 느린 응답자 비교

---

### 5. **Previous Trial Correct** (이전 시행 정답 여부)

**필드**: `previous_trial_correct`
**타입**: `0 | 1`

**설명**: 바로 직전 시행이 정답이었는지 여부

**분석 예시**:
```sql
-- 순차 효과 (Serial Dependence)
SELECT
  previous_trial_correct,
  AVG(correct) as current_accuracy,
  AVG(rt_ms) as current_rt,
  COUNT(*) as n
FROM trial_logs
WHERE previous_trial_correct IS NOT NULL
GROUP BY previous_trial_correct;
```

**논문 활용**:
- **Win-Stay-Lose-Shift**: 정답 후 행동 유지 vs 오답 후 전략 변경
- **Error Correction**: 오답 후 다음 시행에서 더 신중해지는가?
- **Confidence**: 연속 정답 시 과신으로 인한 실수 증가?

---

### 6. **Browser** (브라우저 정보)

**필드**: `browser`
**타입**: `string` ("Chrome", "Firefox", "Safari", "Edge")

**분석 예시**:
```sql
-- 브라우저별 성능 차이
SELECT
  browser,
  COUNT(DISTINCT participant_id) as n_participants,
  AVG(rt_ms) as avg_rt,
  STDDEV(rt_ms) as rt_variability
FROM trial_logs
WHERE browser IS NOT NULL
GROUP BY browser;
```

**논문 활용** (Methods 섹션):
- "Data were collected using Chrome (N=X), Firefox (N=Y), Safari (N=Z)"
- 브라우저 간 RT 차이 보고
- 제외 기준: 특정 브라우저에서 이상치 발견 시

---

### 7. **Operating System** (운영체제)

**필드**: `os`
**타입**: `string` ("Windows", "macOS", "Linux", "iOS", "Android")

**논문 활용**:
- 플랫폼 간 일관성 확인
- 모바일 vs 데스크톱 비교

---

### 8. **Device Type** (기기 타입)

**필드**: `device_type`
**타입**: `'desktop' | 'tablet' | 'mobile'`

**분석 예시**:
```sql
-- 기기별 정확도 비교
SELECT
  device_type,
  COUNT(DISTINCT participant_id) as n_participants,
  AVG(correct) as avg_accuracy,
  AVG(rt_ms) as avg_rt
FROM trial_logs
WHERE device_type IS NOT NULL
GROUP BY device_type;
```

**논문 활용**:
- **Exclusion Criteria**: 모바일 사용자 제외 여부
- **Generalizability**: 기기에 따른 효과 차이
- **Methods**: "All participants completed the study on desktop computers"

---

## 📈 논문별 필수 데이터

### **Cognitive Psychology Journals**
(Journal of Experimental Psychology, Cognition, Psychonomic Bulletin & Review)

**필수 필드**:
1. ✅ `error_type` - SDT 분석
2. ✅ `trials_since_priming` - 시간 효과
3. ✅ `previous_trial_correct` - 순차 효과
4. ✅ `trial_number_global` - 학습 곡선

**추천 분석**:
- d' (d-prime) 계산
- Response bias (c, β)
- Learning curves
- Sequential effects

---

### **Applied Journals**
(Accident Analysis & Prevention, Transportation Research Part F)

**필수 필드**:
1. ✅ `error_type` - 위험한 에러 vs 안전한 에러
2. ✅ `priming_group` - 그룹 간 비교
3. 🔜 `years_driving` - 개인차 (아직 수집 안 함)
4. 🔜 `accident_count_5years` - 사고 이력 (아직 수집 안 함)

**추천 분석**:
- Risky error rate by group
- Real-world implications
- Driver experience moderation

---

### **Human Factors / Ergonomics**
(Human Factors, Applied Ergonomics)

**필수 필드**:
1. ✅ `device_type`, `browser`, `os` - 환경 통제
2. ✅ `rt_ms`, `rt_outlier` - 성능 측정
3. 🔜 `mental_workload` - 인지 부하 (사후 설문 필요)

---

## 🔬 실제 분석 예시

### 예시 1: 프라이밍이 위험한 에러에 미치는 영향

```sql
-- Group A (Urgency)가 risky error를 증가시키는가?
SELECT
  priming_group,
  SUM(CASE WHEN error_type = 'risky_error' THEN 1 ELSE 0 END)::float /
    NULLIF(SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END), 0) as risky_error_proportion,
  SUM(CASE WHEN error_type = 'conservative_error' THEN 1 ELSE 0 END)::float /
    NULLIF(SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END), 0) as conservative_error_proportion
FROM trial_logs
WHERE priming_group IN ('A', 'B', 'C') AND error_type IS NOT NULL
GROUP BY priming_group;
```

**예상 결과** (가설):
- Group A: risky_error ↑ (서두름)
- Group B: conservative_error ↑ (조심스러움)
- Group C: 균형잡힌 에러 분포

---

### 예시 2: 프라이밍 효과의 시간적 패턴

```sql
-- 효과가 즉각적인가? 지속적인가?
WITH binned AS (
  SELECT
    priming_group,
    CASE
      WHEN trials_since_priming <= 3 THEN '0-3 (Immediate)'
      WHEN trials_since_priming <= 7 THEN '4-7 (Early)'
      WHEN trials_since_priming <= 14 THEN '8-14 (Middle)'
      ELSE '15+ (Late)'
    END as time_bin,
    CASE WHEN error_type = 'risky_error' THEN 1 ELSE 0 END as is_risky
  FROM trial_logs
  WHERE priming_group IS NOT NULL AND trials_since_priming IS NOT NULL
)
SELECT
  priming_group,
  time_bin,
  AVG(is_risky) as risky_error_rate
FROM binned
GROUP BY priming_group, time_bin
ORDER BY priming_group, time_bin;
```

---

### 예시 3: 이전 시행의 영향 (Sequential Effects)

```sql
-- 오답 후 다음 시행에서 더 신중해지는가?
SELECT
  priming_group,
  previous_trial_correct,
  AVG(rt_ms) as avg_rt,
  AVG(correct) as avg_accuracy,
  COUNT(*) as n_trials
FROM trial_logs
WHERE previous_trial_correct IS NOT NULL
GROUP BY priming_group, previous_trial_correct
ORDER BY priming_group, previous_trial_correct;
```

**예상 패턴**:
- 오답 후 (previous_trial_correct=0) → RT 증가 (더 신중)
- 정답 후 (previous_trial_correct=1) → RT 유지

---

## 📝 Methods Section에 포함할 내용

### Data Collection

> "Trial-level data were recorded including reaction time (ms), response choice, accuracy, and error classification (conservative vs. risky errors for Signal Detection Theory analysis). Additional measures included trial position (global trial number), temporal distance from priming exposure (trials and time since priming), and sequential dependencies (previous trial outcome). Technical metadata (browser, operating system, device type) were collected for quality control purposes."

### Participants

> "A total of N participants completed the study on desktop computers (X%), tablets (Y%), or mobile devices (Z%). Browsers used included Chrome (X%), Firefox (Y%), and Safari (Z%)."

### Data Quality

> "Data quality was ensured through attention checks (attention_check field), reaction time outlier detection (rt_outlier, rt_too_fast, rt_too_slow), and focus monitoring (focus_lost field)."

---

## 🚀 다음 단계: 사후 설문 추가 (선택사항)

현재는 **시행 레벨 데이터만** 수집됩니다. 더 풍부한 분석을 위해서는 **실험 후 설문**도 추가하세요:

### 추가 권장 설문:
1. **운전 경험** (`years_driving`, `weekly_driving_hours`, `accident_count_5years`)
2. **Manipulation Check** (`priming_recall_accuracy`, `priming_influence_rating`)
3. **인지 부하** (`mental_workload_nasa_tlx`)
4. **주관적 난이도** (`task_difficulty_rating`)

---

## 📊 데이터베이스 마이그레이션

**Supabase에서 실행**:
1. `supabase_migration_priming_group.sql` - 프라이밍 그룹 필드
2. `supabase_migration_research_fields.sql` - 연구 분석 필드 (새로 생성됨!)

---

## ✅ 현재 상태

| 데이터 필드 | 수집 중 | 데이터베이스 | CSV 내보내기 |
|------------|---------|-------------|-------------|
| error_type | ✅ | 🔜 마이그레이션 필요 | ✅ |
| trial_number_global | ✅ | 🔜 마이그레이션 필요 | ✅ |
| trials_since_priming | ✅ | 🔜 마이그레이션 필요 | ✅ |
| time_since_priming_ms | ✅ | 🔜 마이그레이션 필요 | ✅ |
| previous_trial_correct | ✅ | 🔜 마이그레이션 필요 | ✅ |
| browser | ✅ | 🔜 마이그레이션 필요 | ✅ |
| os | ✅ | 🔜 마이그레이션 필요 | ✅ |
| device_type | ✅ | 🔜 마이그레이션 필요 | ✅ |

**다음 할 일**: Supabase SQL Editor에서 `supabase_migration_research_fields.sql` 실행!

---

**작성일**: 2025-12-28
**버전**: 1.0
**상태**: ✅ 프론트엔드 구현 완료, 데이터베이스 마이그레이션 대기 중
