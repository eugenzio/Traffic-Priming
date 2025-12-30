# Methods Section - Apparatus and Materials

## 📝 학술 논문용 Methods 섹션

---

### Apparatus and Materials

본 연구는 좌회전 교차로 상황에서의 의사결정을 평가하기 위해 연구자가 직접 개발한 맞춤형 웹 기반 실험 플랫폼을 사용하였다. 프론트엔드는 **React (v18.2.0; Meta Platforms, Inc., Menlo Park, CA, USA)**[1] 프레임워크와 **TypeScript (v5.6.2; Microsoft Corporation, Redmond, WA, USA)**[2]를 사용하여 구현하였으며, 애플리케이션 빌드 및 실행 환경은 **Vite (v5.4.0; Evan You, https://vitejs.dev)**[3]를 기반으로 구성되었다.

실험 인터페이스는 시작 화면(참여자 정보 수집), 실험 안내 화면, 연습 시행(3회), 프라이밍(priming) 화면, 본 실험 시행(21회), 피드백 화면의 순차적인 단계로 구성되었다. 화면 간의 부드러운 전환과 시각적 자극의 정밀한 제어를 위해 **Framer Motion 라이브러리 (v12.23.24; Framer B.V., Amsterdam, Netherlands)**[4]를 활용하였다. 모든 시각적 자극은 참여자의 브라우저 환경에 관계없이 일관된 비율로 제시되도록 CSS relative units (vw, vh)로 설계되었으며, 참여자들은 실험 전 데스크톱 또는 노트북 컴퓨터에서 최신 버전의 Chrome, Firefox, 또는 Safari 브라우저를 사용하도록 지시받았다. 권장 화면 해상도는 1280×720 이상이었으며, 화면 주사율은 60Hz 이상이 권장되었다.

실험 데이터는 **Supabase (Supabase Inc., Singapore)**[5]의 **PostgreSQL (v15; PostgreSQL Global Development Group)**[6] 데이터베이스에 실시간으로 암호화되어 저장되었으며, 개인 식별 정보(PII)는 수집하지 않았다. 클라이언트와 서버 간의 데이터 통신은 **@supabase/supabase-js (v2.75.0)**[7]를 통한 RESTful API로 수행되었다. 본 플랫폼은 **Netlify (Netlify, Inc., San Francisco, CA, USA)**[8]를 통해 HTTPS 프로토콜로 배포되었으며, Content Delivery Network (CDN)을 활용하여 네트워크 지연(latency)을 최소화함으로써 모든 참여자에게 동일한 실험 환경을 제공하였다.

### Study Procedures

#### Experimental Procedure

실험은 다음의 순차적인 단계로 진행되었다: (1) 연구 동의, (2) 참여자 정보 수집, (3) 실험 안내, (4) 연습 시행, (5) 프라이밍 노출, (6) 본 실험 시행, (7) 피드백 제공. 모든 절차는 웹 브라우저 내에서 완료되었으며, 참여자는 개별적으로 자신의 속도에 맞춰 실험을 진행하였다. 전체 실험 절차를 완료하는 데 소요된 시간은 평균 약 10-15분이었다.

**연구 동의 (Informed Consent)**. 실험 접속 시, 참여자는 연구의 목적, 절차, 데이터의 익명성 보장, 중도 포기 권리에 대한 안내문을 읽고, "동의함(I Agree)" 버튼을 클릭하여 전자 동의(electronic informed consent)를 완료하였다. 동의하지 않은 경우 실험은 자동으로 종료되었다.

**참여자 정보 수집 (Demographic Data Collection)**. 전자 동의 완료 후, 참여자는 연령, 성별, 운전면허 보유 여부, 거주 지역(조지아주 내 권역 및 카운티)에 대한 인구통계학적 정보를 제공하였다. 모든 응답은 익명으로 처리되었으며, 개인 식별 정보는 수집되지 않았다.

**실험 안내 (Instruction Phase)**. 참여자는 좌회전 교차로 상황에서 신호등 상태, 대향 차량의 접근 속도, 보행자 유무를 고려하여 좌회전 여부를 결정하는 과제에 대한 설명을 받았다. 응답 방법은 키보드의 **← (좌측 화살표) 키**를 눌러 좌회전 의사를 표시하거나, **Space bar**를 눌러 대기하는 것으로 지시되었다. 기본적으로 황색 및 적색 신호에 반응하도록 안내받았으나, 모든 시행에서 주의를 유지하도록 지시받았다.

**연습 시행 (Practice Trials)**. 본 실험 전, 참여자는 3회의 연습 시행을 완료하였다. 연습 시행은 본 실험과 동일한 자극 제시 방식과 응답 절차를 따랐으며, 각 응답 후 즉각적인 피드백(정답/오답 표시 및 반응 시간)이 제공되었다. 연습 시행의 목적은 참여자가 과제 요구 사항을 이해하고 응답 인터페이스에 익숙해지도록 하는 것이었다.

**프라이밍 노출 (Priming Exposure)**. 연습 시행 완료 후, 참여자는 무작위로 3개의 프라이밍 조건 중 하나에 배정되었다: Group A (Urgency priming), Group B (Safety priming), 또는 Group C (Control). 각 프라이밍 화면은 약 15-20초 동안 제시되었으며, 참여자는 화면의 내용을 읽은 후 "I UNDERSTAND" 버튼을 클릭하여 다음 단계로 진행하였다. 프라이밍 조건별 구체적인 메시지는 다음과 같다:

- **Group A (Urgency)**: 참여자는 애틀랜타 시내 교통 체증 상황에 처해 있으며, 신호등에서 3회 연속 대기했고, 뒤차들이 경적을 울리고 있다는 시나리오가 제시되었다 (붉은색 시각 강조).

- **Group B (Safety)**: 참여자는 사각지대가 많고 대향 차량이 고속으로 접근하는 위험한 교차로에 있으며, 보호 좌회전 신호가 없다는 시나리오가 제시되었다 (호박색 시각 강조).

- **Group C (Control)**: 참여자는 교통량이 적고 날씨가 맑은 평범한 주거 지역 도로에 있다는 중립적인 시나리오가 제시되었다 (파란색 시각 강조).

프라이밍 화면은 실험 세션 동안 단 한 번만 제시되었으며, 참여자가 브라우저를 새로고침하거나 세션을 재시작하더라도 동일한 프라이밍 조건이 유지되었다 (localStorage 기반 세션 관리).

**본 실험 시행 (Test Trials)**. 프라이밍 노출 후, 참여자는 21회의 본 실험 시행을 완료하였다. 시행 순서는 모든 참여자에게 동일하게 고정되었으며(fixed trial order), 이는 시행의 시간적 위치(temporal position)에 따른 효과를 통제하고, 프라이밍 효과의 시간적 감쇠 패턴(temporal decay)을 참여자 간 일관되게 측정하기 위함이었다. 각 시행은 다음의 절차로 진행되었다:

1. **자극 제시**: 교차로 장면이 화면에 제시되었다. 장면은 좌회전 차량의 운전자 시점에서 묘사되었으며, 다음의 요소들을 포함하였다: (a) 신호등 상태 (황색 또는 적색), (b) 대향 차량의 접근 여부 및 Time-To-Collision (TTC: 2.0초, 2.5초, 3.0초, 3.5초, 4.0초), (c) 횡단보도 상의 보행자 유무.

2. **응답 수집**: 참여자는 제시된 장면을 평가하고, 좌회전이 안전하다고 판단되면 **← 키**를, 대기가 필요하다고 판단되면 **Space bar**를 눌렀다. 반응 시간(reaction time)은 장면 제시 순간부터 키 입력까지의 시간으로 밀리초(ms) 단위로 자동 측정되었다.

3. **시행 간 간격**: 각 시행 후, 500ms의 blank screen이 제시된 후 다음 시행이 자동으로 시작되었다.

4. **주의력 검사 (Attention Checks)**: 21회의 시행 중 일부는 명백한 정답이 있는 주의력 검사 시행으로 구성되었다 (예: 녹색 신호에서 대향 차량이 없고 보행자가 없는 상황). 이는 참여자의 과제 몰입도를 평가하기 위해 사용되었다.

**피드백 제공 (Feedback Screen)**. 모든 시행 완료 후, 참여자는 전체 정확도(%), 평균 반응 시간(ms), 그리고 오류 유형별 빈도를 포함한 요약 피드백을 받았다. 데이터는 자동으로 Supabase 데이터베이스에 저장되었으며, 참여자는 실험 참여에 대한 감사 메시지와 함께 실험을 종료하였다.

#### Data Collection and Recording

각 시행마다 다음의 데이터가 자동으로 기록되었다: 시행 번호, 장면 구성 요소(신호등 상태, TTC, 보행자 유무), 참여자 응답(좌회전/대기), 정답 여부, 반응 시간(ms), 오류 유형(conservative error, risky error, correct go, correct no-go), 프라이밍 후 경과 시행 수, 프라이밍 후 경과 시간(ms), 이전 시행 정답 여부, 브라우저 유형, 운영체제, 기기 유형. 모든 데이터는 참여자의 브라우저에서 실시간으로 Supabase PostgreSQL 데이터베이스로 전송되었으며, 네트워크 장애 시 로컬 저장소(localStorage)에 임시 저장되었다가 연결 복구 시 자동 업로드되었다.

#### Outcome Measures

**주요 결과 변수 (Primary Outcome)**는 프라이밍 조건(A, B, C)에 따른 위험한 오류(risky error) 비율이었다. Risky error는 대기해야 하는 상황(적색 신호, 짧은 TTC, 보행자 존재)에서 좌회전을 선택한 경우로 정의되었다 (Signal Detection Theory의 False Alarm에 해당).

**부차적 결과 변수 (Secondary Outcomes)**는 다음과 같다: (a) 보수적 오류(conservative error) 비율 (좌회전 가능한 상황에서 대기 선택, Miss/Type II error), (b) 평균 반응 시간, (c) 전체 정확도, (d) 프라이밍 효과의 시간적 감쇠 패턴(trials since priming에 따른 오류율 변화), (e) 순차 효과(이전 시행 정답 여부가 현재 시행 수행에 미치는 영향).

실험 인터페이스의 구성 및 진행 흐름은 **Figure 1**과 같다.

---

## 📊 수집된 데이터 필드

각 시행마다 다음의 데이터가 자동으로 기록되었다:

### 참여자 정보
- `participant_id`: 고유 식별자 (UUID)
- `age`: 연령
- `gender`: 성별 (Male, Female, Non-binary, Prefer not to say)
- `priming_group`: 프라이밍 조건 (A: Urgency, B: Safety, C: Control)
- `browser`: 브라우저 종류 (Chrome, Firefox, Safari, Edge)
- `os`: 운영체제 (Windows, macOS, Linux, iOS, Android)
- `device_type`: 기기 유형 (desktop, tablet, mobile)

### 시행 데이터 (Trial-level data)
- `trial_number_global`: 전체 시행 번호 (1-21)
- `signal`: 신호등 상태 (yellow, red)
- `oncoming_car_ttc`: 대향 차량 접근 시간 (초)
- `pedestrian`: 보행자 유무 (boolean)
- `choice`: 참여자 선택 (turn_left, wait)
- `correct`: 정답 여부 (0 or 1)
- `rt_ms`: 반응 시간 (밀리초)

### 연구 분석 필드
- `error_type`: 오류 유형 (conservative_error, risky_error, correct_go, correct_nogo)
- `trials_since_priming`: 프라이밍 후 경과 시행 수
- `time_since_priming_ms`: 프라이밍 후 경과 시간 (밀리초)
- `previous_trial_correct`: 이전 시행 정답 여부 (0 or 1)

### 데이터 품질 관리
- `rt_outlier`: 반응 시간 이상치 여부 (±3 SD)
- `rt_too_fast`: 지나치게 빠른 반응 (<200ms)
- `rt_too_slow`: 지나치게 느린 반응 (>10000ms)
- `focus_lost`: 화면 포커스 상실 횟수
- `is_attention_check`: 주의력 검사 시행 여부

---

## 🔍 데이터 품질 통제 (Data Quality Control)

데이터 품질은 다음의 기준으로 확보되었다:

1. **반응 시간 필터링**: 200ms 미만의 반응(추측 반응)과 10,000ms 초과 반응(집중력 저하)은 이상치로 표시되었다.
2. **화면 포커스 모니터링**: 실험 중 브라우저 탭 전환이나 화면 이탈이 기록되었다.
3. **주의력 검사 (Attention checks)**: 무작위로 삽입된 명백한 정답 시행을 통해 참여자의 집중도를 확인하였다.
4. **중복 참여 방지**: 브라우저 localStorage를 활용하여 동일 기기에서의 중복 참여를 차단하였다.

---

## 💻 기술 사양 요약표

| 구성 요소 | 기술/버전 | 제공자 |
|-----------|----------|--------|
| **프론트엔드 프레임워크** | React v18.2.0 | Meta Platforms, Inc. |
| **프로그래밍 언어** | TypeScript v5.6.2 | Microsoft Corporation |
| **빌드 도구** | Vite v5.4.0 | Evan You |
| **애니메이션 라이브러리** | Framer Motion v12.23.24 | Framer B.V. |
| **데이터베이스** | PostgreSQL v15 (Supabase) | Supabase Inc. |
| **API 클라이언트** | @supabase/supabase-js v2.75.0 | Supabase Inc. |
| **호스팅 플랫폼** | Netlify | Netlify, Inc. |
| **프로토콜** | HTTPS with CDN | - |

---

## 📸 Figure 1 캡션 예시

**Figure 1.** Experimental procedure and interface design. (A) Start screen for demographic information collection. (B) Practice trial screen with visual feedback. (C) Priming screen showing one of three between-subjects conditions (Urgency, Safety, or Control). (D) Main trial screen displaying left-turn scenario with signal status, oncoming vehicle, and pedestrian presence. (E) Feedback screen displaying accuracy and response time summary. The experiment progressed sequentially from (A) to (E), with participants completing 3 practice trials before priming exposure and 21 test trials after priming.

---

## 📚 References (참고문헌)

[1] React (2024). A JavaScript library for building user interfaces. Meta Platforms, Inc. https://react.dev

[2] TypeScript (2024). Typed JavaScript at any scale. Microsoft Corporation. https://www.typescriptlang.org

[3] Vite (2024). Next generation frontend tooling. Evan You. https://vitejs.dev

[4] Framer Motion (2024). Production-ready animation library for React. Framer B.V. https://www.framer.com/motion

[5] Supabase (2024). The open source Firebase alternative. Supabase Inc. https://supabase.com

[6] PostgreSQL (2024). The world's most advanced open source relational database. PostgreSQL Global Development Group. https://www.postgresql.org

[7] @supabase/supabase-js (2024). Isomorphic JavaScript client for Supabase. Supabase Inc. https://github.com/supabase/supabase-js

[8] Netlify (2024). Develop & deploy the best web experiences in record time. Netlify, Inc. https://www.netlify.com

---

## 📝 사용 팁

### Methods 섹션에 포함할 내용:
1. **위의 "Apparatus and Materials" 단락 전체**를 복사하여 논문에 붙여넣기
2. **Figure 1** 준비: 실험 화면 스크린샷 5개를 배치한 그림 만들기
3. **Table 1** (선택사항): 위의 "기술 사양 요약표" 사용
4. **Data Quality** 단락을 별도 섹션으로 추가 가능

### 저널별 맞춤:
- **인지심리학 저널** (JEP, Cognition): 위 내용 전체 사용
- **응용 저널** (Accident Analysis & Prevention): 기술 세부사항 축약 가능
- **Human Factors**: 화면 사양 및 반응 시간 측정 정밀도 강조

---

**작성일**: 2025-12-29
**버전**: 1.0
**상태**: ✅ 학술 논문 제출 준비 완료
