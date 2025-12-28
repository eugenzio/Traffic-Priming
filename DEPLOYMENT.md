# 🚀 배포 가이드 - Gap Acceptance Priming Experiment

이 가이드는 실험 사이트를 Vercel에 무료로 배포하는 방법을 설명합니다.

---

## 📋 사전 준비

### 1. Supabase 프로젝트 설정

1. **Supabase 대시보드** 접속: https://supabase.com/dashboard
2. **SQL Editor**에서 마이그레이션 실행:
   - `supabase_migration_complete.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - **Run** 클릭

3. **API 키 확인**:
   - Project Settings → API
   - `Project URL` 복사 (예: `https://abc123.supabase.co`)
   - `anon public` 키 복사

### 2. GitHub 레포지토리 확인

```bash
git remote -v
# origin	https://github.com/eugenzio/Traffic-Priming.git
```

이미 설정되어 있습니다! ✅

---

## 🌐 Vercel 배포 (무료)

### 방법 1: Vercel 웹사이트 사용 (가장 쉬움)

#### Step 1: Vercel 계정 생성
1. https://vercel.com 접속
2. **Sign Up** → **Continue with GitHub**
3. GitHub 계정으로 로그인

#### Step 2: 프로젝트 임포트
1. Vercel 대시보드에서 **Add New** → **Project** 클릭
2. GitHub에서 `Traffic-Priming` 레포지토리 선택
3. **Import** 클릭

#### Step 3: 프로젝트 설정
- **Framework Preset**: Vite
- **Root Directory**: `./` (기본값)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

#### Step 4: 환경 변수 설정
**Environment Variables** 섹션에서 추가:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` (Supabase Project URL) |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` (Supabase anon public key) |
| `VITE_USE_DB` | `true` |

> 💡 **중요**: Supabase 대시보드 → Project Settings → API에서 실제 값을 복사하세요!

#### Step 5: 배포
1. **Deploy** 버튼 클릭
2. 빌드 완료 대기 (약 1-2분)
3. 배포 완료! 🎉

배포된 URL 예시: `https://traffic-priming.vercel.app`

---

### 방법 2: Vercel CLI 사용 (터미널)

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 디렉토리에서 배포
cd "/Users/chachaboi/Traffic Experiment"
vercel

# 4. 질문에 답하기
# - Set up and deploy? Y
# - Which scope? (GitHub 계정 선택)
# - Link to existing project? N
# - Project name? traffic-priming (또는 원하는 이름)
# - Directory? ./
# - Override settings? Y
#   - Build Command: cd frontend && npm install && npm run build
#   - Output Directory: frontend/dist
#   - Install Command: cd frontend && npm install

# 5. 환경 변수 추가
vercel env add VITE_SUPABASE_URL
# 값 입력: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# 값 입력: your-anon-key-here

vercel env add VITE_USE_DB
# 값 입력: true

# 6. 프로덕션 배포
vercel --prod
```

---

## 🔧 로컬에서 프로덕션 빌드 테스트

배포 전에 로컬에서 테스트:

```bash
# 1. 환경 변수 설정
cd frontend
cp .env.example .env.local

# .env.local 파일 편집:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
# VITE_USE_DB=true

# 2. 빌드
npm run build

# 3. 프로덕션 미리보기
npm run preview
# → http://localhost:5173 에서 확인

# 4. 테스트
# - 실험 진행
# - 데이터가 Supabase에 저장되는지 확인
# - 모든 화면이 정상 작동하는지 확인
```

---

## ✅ 배포 후 확인 사항

### 1. 실험 진행 테스트
- [ ] 참가자 정보 입력 화면 정상 작동
- [ ] 실험 가이드 표시
- [ ] 연습 시행 3회 완료
- [ ] 프라이밍 화면 표시 (Group A/B/C 무작위 배정)
- [ ] 실제 시행 21회 완료
- [ ] 피드백 화면 표시

### 2. 데이터 수집 확인
- [ ] Supabase 대시보드 → Table Editor → `trial_logs`
- [ ] 실험 데이터가 실시간으로 저장되는지 확인
- [ ] 모든 17개 컬럼에 데이터가 정상적으로 들어가는지 확인

### 3. 성능 확인
- [ ] 페이지 로딩 속도
- [ ] 이미지 로딩 (차량, 신호등)
- [ ] 애니메이션 부드러움
- [ ] 모바일 반응성

---

## 🔒 보안 설정 (Supabase RLS)

### Row Level Security (RLS) 정책 설정

Supabase에서 **Authentication → Policies**:

```sql
-- trial_logs 테이블에 대한 INSERT 허용 (누구나 데이터 쓰기 가능)
CREATE POLICY "Allow anonymous insert"
ON public.trial_logs
FOR INSERT
TO anon
WITH CHECK (true);

-- 읽기는 인증된 사용자만 (선택사항)
CREATE POLICY "Allow authenticated read"
ON public.trial_logs
FOR SELECT
TO authenticated
USING (true);
```

또는 **완전 공개** (연구용):
```sql
-- 모두에게 읽기/쓰기 허용
ALTER TABLE public.trial_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access"
ON public.trial_logs
FOR ALL
USING (true)
WITH CHECK (true);
```

---

## 📊 데이터 다운로드

### Supabase에서 CSV 내보내기

```sql
-- SQL Editor에서 실행
COPY (
  SELECT *
  FROM trial_logs
  ORDER BY created_at
) TO STDOUT WITH CSV HEADER;
```

또는:
- Table Editor → 오른쪽 상단 **"Download CSV"** 클릭

---

## 🌍 커스텀 도메인 연결 (선택사항)

Vercel에서 커스텀 도메인 설정:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력 (예: `traffic-experiment.com`)
4. DNS 설정 안내에 따라 도메인 제공업체에서 설정

무료 도메인 옵션:
- `traffic-priming.vercel.app` (Vercel 기본)
- `*.github.io` (GitHub Pages)

---

## 🐛 문제 해결

### 빌드 실패
```bash
# 로컬에서 빌드 테스트
cd frontend
npm install
npm run build
```

### 환경 변수 오류
- Vercel 대시보드 → Settings → Environment Variables
- 모든 변수가 `Production`, `Preview`, `Development`에 체크되어 있는지 확인

### Supabase 연결 실패
- Supabase 프로젝트가 paused 상태인지 확인
- API 키가 올바른지 확인
- RLS 정책이 설정되어 있는지 확인

### 데이터가 저장 안 됨
1. 브라우저 개발자 도구 → Console 확인
2. Network 탭에서 Supabase 요청 확인
3. Supabase 대시보드 → Logs에서 에러 확인

---

## 📞 지원

**배포 관련 문제**:
- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs

**실험 코드 문제**:
- GitHub Issues: https://github.com/eugenzio/Traffic-Priming/issues

---

## 🎉 배포 완료!

배포가 완료되면:

1. ✅ 누구나 접속 가능한 공개 URL 확보
2. ✅ 자동으로 HTTPS 적용 (보안)
3. ✅ Git push 시 자동 재배포
4. ✅ 전 세계 CDN으로 빠른 로딩
5. ✅ 무료로 무제한 사용 가능

**배포된 사이트 URL을 참가자들에게 공유하세요!**

예시: `https://traffic-priming.vercel.app`
