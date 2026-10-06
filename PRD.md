# [PRD] 카페 프랜차이즈 「오늘의원두」 지점 매출 및 공휴일 분석 대시보드

## 1. 프로젝트 개요

* **목적**: 카카오톡 및 개인 PC 엑셀로 분산 관리되던 5개 지점의 월별 매출 취합 업무를 웹 기반으로 일원화. 지점장이 직접 입력하고, 대표자 및 본사 관리자가 언제 어디서나 전용 링크로 지점별·월별 매출 및 공휴일 연동 지표를 실시간 조회할 수 있도록 함.
* **대상 지점 (5곳)**: 용산역점, 삼각지점, 이태원점, 효창공원점, 한남점
* **핵심 타깃 사용자**:
  * **지점장**: 모바일에서 간이 비밀번호 인증 후 간편하게 당월 매출/객수/비고 입력
  * **대표이사 / 본사 관리자**: 별도 로그인 없이 공유받은 전용 URL을 통해 지점별 실적 비교, 월별 추이, 공휴일 영향도를 즉시 확인
* **개발 및 데이터 운용 원칙 (중요)**:
  * **만드는 동안 Supabase DB에 시험 데이터를 넣거나 지우지 않는다. 확인은 화면에서 사람이 한다.**

---

## 2. 기술 스택 및 아키텍처

* **프레임워크**: Next.js 14+ (App Router 권장), TypeScript, Tailwind CSS, shadcn/ui
* **차트 라이브러리**: Recharts (또는 Chart.js)
* **데이터베이스 / 백엔드**: Supabase (PostgreSQL)
* **외부 API**: 공공데이터포털 한국천문연구원 「특일 정보」 API (공휴일 정보 조회)
* **배포 환경**: Vercel

---

## 3. 페이지 구성 및 핵심 기능 요구사항

### 3.1. 지점장 매출 입력 페이지 (`/input`)

* **접근 방식**: 모바일 반응형 웹 UI
* **인증**: 지점 선택(드롭다운) + 해당 지점의 간이 PIN 번호(숫자 4~6자리) 입력 후 접근
* **입력 폼 필드**:
  1. **월**: `YYYY-MM` 선택 (기본값: 전월 또는 당월)
  2. **매출액**: 숫자 입력 (원 단위, 실시간 콤마 표기 예: 54,320,000)
  3. **객수**: 숫자 입력 (명 단위, 예: 6,820)
  4. **비고**: 텍스트 입력 (특이사항 기재: 예 - "추석 연휴 3일 단축 영업", "공사 미완료" 등)
* **동작 규칙**:
  * 해당 연월에 이미 등록된 데이터가 있을 경우: 기존 입력 데이터를 불러와 보여주며 '수정(업데이트)' 확인 알림창 노출 후 저장(Upsert 처리).
  * 저장 성공 시 완료 토스트 팝업 표시.

---

### 3.2. 대표이사 / 본사용 대시보드 페이지 (`/dashboard/[secret-token]` 또는 `/dashboard`)

* **접근 방식**: 비밀 토큰이 포함된 전용 링크(URL)를 통해 별도 로그인 없이 즉시 조회.
* **상단 KPI 카드 요약**:
  * 당월(최근 월) 전 지점 총매출액 및 전월 대비 증감률(%)
  * 당월 총 객수 및 평균 객단가 (`매출액 ÷ 객수`)
  * 당월 법정 공휴일 일수 뱃지 (예: `9월 공휴일: 3일`)
* **핵심 차트 영역**:
  1. **월별 전체 매출 추이 & 공휴일 복합 차트 (Composed Chart)**
     * **X축**: 월 (2026-03, 2026-04, 2026-05, ...)
     * **Y1축 (좌측)**: 총매출액 (Bar 또는 Line)
     * **Y2축 (우측)**: 법정 공휴일 수 (일 단위, 보조 Bar 또는 배지 툴팁)
     * **툴팁(Tooltip)**: 마우스 오버 시 `해당 월 총매출`, `전 지점 총 객수`, `공휴일 명칭 및 일수` 표시
  2. **지점별 실적 비교 차트 (Multi-bar Chart)**
     * 월 선택 드롭다운 (기본: 최근 월)
     * 5개 지점별 매출액 나란히 비교
* **상세 데이터 테이블 (Table View)**:
  * 열 구성: `월`, `지점`, `매출액`, `객수`, `객단가`, `비고`
  * 정렬 기능 (매출액순, 지점순, 최신순)
  * 필터링 기능 (특정 지점만 보기 / 전체 보기)
  * 엑셀(CSV) 다운로드 기능

---

### 3.3. 공휴일 API 연동 및 캐싱 (`/api/holidays`)

* **API 호출**: 공공데이터포털 `getRestDeInfo` (한국천문연구원 특일 정보 제공 서비스)
* **동작 방식**:
  * 클라이언트가 직접 API를 호출하지 않고, Next.js Route Handler(`app/api/holidays/route.ts`)를 통해 서버 사이드에서 호출.
  * 중복 호출 방지를 위해 연도/월 단위로 Supabase의 `holidays` 테이블에 캐싱하거나 메모리 캐시를 적용.
  * 주말(토, 일)을 제외한 **평일 공휴일(대체공휴일 포함)** 일수와 공휴일 명칭 리스트를 집계하여 반환.

---

## 4. 데이터베이스 설계 (Supabase SQL)

```sql
-- 1. 지점 마스터 테이블
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(50) UNIQUE NOT NULL, -- 용산역점, 삼각지점, 이태원점, 효창공원점, 한남점
    pin_code VARCHAR(255) NOT NULL,          -- 간이 PIN (예: '1234')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 지점 데이터 등록
INSERT INTO branches (branch_name, pin_code) VALUES
('용산역점', '1111'),
('삼각지점', '2222'),
('이태원점', '3333'),
('효창공원점', '4444'),
('한남점', '5555');

-- 2. 지점별 월별 매출 데이터 테이블 (열 이름: 한글 적용)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    월 VARCHAR(7) NOT NULL,                  -- 형식: 'YYYY-MM'
    지점 VARCHAR(50) NOT NULL,               -- 지점명
    매출액 BIGINT NOT NULL,                  -- 매출액 (원)
    객수 INT NOT NULL,                       -- 객수 (명)
    비고 TEXT,                               -- 비고 (특이사항)
    CONSTRAINT unique_branch_month UNIQUE (지점, 월)
);

-- 3. 공휴일 캐싱 테이블
CREATE TABLE holidays (
    id SERIAL PRIMARY KEY,
    locdate VARCHAR(8) UNIQUE NOT NULL,      -- 형식: 'YYYYMMDD'
    date_name VARCHAR(100) NOT NULL,         -- 예: '추석', '어린이날'
    is_holiday BOOLEAN DEFAULT TRUE,
    year_month VARCHAR(7) NOT NULL           -- 형식: 'YYYY-MM'
);
```

---

## 5. 보안 및 환경 변수 관리 가이드 (개발 비전공자용 필수 수칙)

### 5.1. 절대 GitHub에 올리면 안 되는 정보 및 폴더

* 공공데이터포털 API 인증키 (Encoding/Decoding Key)
* Supabase Service Role Key (관리자 권한 키) 및 데이터베이스 비밀번호
* 대시보드 접근용 시크릿 토큰 문자열
* **받은자료 폴더는 GitHub에 올리지 않는다.** (사내 원본 엑셀 및 메신저 내역 등 민감 데이터 보호)

### 5.2. 환경 변수 템플릿 (`.env.local`)

프로젝트 최상위 경로에 `.env.local` 파일을 생성하고 아래 형식으로 저장합니다. (이 파일은 로컬 컴퓨터에서만 실행되며 깃허브에 커밋되지 않아야 합니다.)

```env
# Supabase 연동 정보
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# 공공데이터포털 특일 정보 API
HOLIDAY_API_SERVICE_KEY=your-decoded-api-key-here
HOLIDAY_API_URL=http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo

# 대시보드 보안 링크 토큰 (원하는 임의의 문자열)
DASHBOARD_ACCESS_SECRET=brew-boss-secret-key-2026
```

### 5.3. `.gitignore` 점검

프로젝트 루트의 `.gitignore` 파일에 반드시 다음 항목이 포함되어 있는지 확인합니다:

```gitignore
.env
.env*.local
node_modules
받은자료/
```

### 5.4. Vercel 배포 시 환경 변수 설정법

1. Vercel에 GitHub 저장소를 연결하여 프로젝트를 생성합니다.
2. 배포 전 **Settings > Environment Variables** 메뉴로 이동합니다.
3. `.env.local`에 작성했던 Key와 Value를 각각 추가합니다.
4. 배포를 진행하면 코드 내에 키 노출 없이 Vercel 서버에서 안전하게 값을 불러옵니다.

---

## 6. 초기 데이터 마이그레이션 안내

* 기존 엑셀(`지점매출_2026년3-8월.csv`) 및 단톡방 `9월 매출 보고` 데이터 총 35건(3월~9월 각 지점별 7개월치)은 Supabase 대시보드의 **Table Editor > sales > Insert > Import data from CSV**를 통해 한 번에 등록하여 대시보드에서 3월부터 연속된 추이 그래프가 바로 나타나도록 구성합니다.
* **주의**: 만드는 동안 Supabase DB에 임의의 시험 데이터를 넣거나 지우지 않으며, 기능 확인은 화면에서 사람이 직접 확인합니다.
