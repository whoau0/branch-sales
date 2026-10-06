import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 2026년 대한민국 주요 공휴일 기본 데이터 (API 미설정 또는 실패 시 Fallback용)
const DEFAULT_2026_HOLIDAYS = [
  { locdate: "20260101", date_name: "신정", year_month: "2026-01" },
  { locdate: "20260216", date_name: "설날 연휴", year_month: "2026-02" },
  { locdate: "20260217", date_name: "설날", year_month: "2026-02" },
  { locdate: "20260218", date_name: "설날 연휴", year_month: "2026-02" },
  { locdate: "20260301", date_name: "삼일절", year_month: "2026-03" },
  { locdate: "20260302", date_name: "삼일절 대체공휴일", year_month: "2026-03" },
  { locdate: "20260505", date_name: "어린이날", year_month: "2026-05" },
  { locdate: "20260524", date_name: "부처님오신날", year_month: "2026-05" },
  { locdate: "20260525", date_name: "부처님오신날 대체공휴일", year_month: "2026-05" },
  { locdate: "20260606", date_name: "현충일", year_month: "2026-06" },
  { locdate: "20260815", date_name: "광복절", year_month: "2026-08" },
  { locdate: "20260817", date_name: "광복절 대체공휴일", year_month: "2026-08" },
  { locdate: "20260924", date_name: "추석 연휴", year_month: "2026-09" },
  { locdate: "20260925", date_name: "추석", year_month: "2026-09" },
  { locdate: "20260926", date_name: "추석 연휴", year_month: "2026-09" },
  { locdate: "20261003", date_name: "개천절", year_month: "2026-10" },
  { locdate: "20261005", date_name: "개천절 대체공휴일", year_month: "2026-10" },
  { locdate: "20261009", date_name: "한글날", year_month: "2026-10" },
  { locdate: "20261225", date_name: "성탄절", year_month: "2026-12" },
];

function isWeekday(locdateStr: string): boolean {
  if (locdateStr.length !== 8) return true;
  const y = parseInt(locdateStr.substring(0, 4), 10);
  const m = parseInt(locdateStr.substring(4, 6), 10) - 1;
  const d = parseInt(locdateStr.substring(6, 8), 10);
  const day = new Date(y, m, d).getDay();
  // 0 = 일요일, 6 = 토요일
  return day !== 0 && day !== 6;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || "2026";
    const yearMonth = searchParams.get("yearMonth"); // e.g. '2026-09'

    // 1. Supabase 캐시 확인
    let query = supabase.from("holidays").select("*");
    if (yearMonth) {
      query = query.eq("year_month", yearMonth);
    } else {
      query = query.like("year_month", `${year}-%`);
    }

    const { data: cachedHolidays, error: cacheError } = await query;

    let holidays: { locdate: string; date_name: string; year_month: string }[] = [];

    if (!cacheError && cachedHolidays && cachedHolidays.length > 0) {
      holidays = cachedHolidays;
    } else {
      // 2. 외부 API 호출 시도
      const apiKey = process.env.HOLIDAY_API_KEY || process.env.HOLIDAY_API_SERVICE_KEY;
      let fetchedHolidays: typeof holidays = [];

      if (apiKey) {
        try {
          const apiUrl = new URL(
            "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo"
          );
          apiUrl.searchParams.set("serviceKey", apiKey);
          apiUrl.searchParams.set("solYear", year);
          apiUrl.searchParams.set("numOfRows", "100");
          apiUrl.searchParams.set("_type", "json");

          const res = await fetch(apiUrl.toString(), { next: { revalidate: 86400 } });
          if (res.ok) {
            const data = await res.json();
            const items = data?.response?.body?.items?.item;
            if (items) {
              const itemList = Array.isArray(items) ? items : [items];
              fetchedHolidays = itemList
                .filter((item: any) => item.isHoliday === "Y")
                .map((item: any) => {
                  const locdate = String(item.locdate);
                  const ym = `${locdate.substring(0, 4)}-${locdate.substring(4, 6)}`;
                  return {
                    locdate,
                    date_name: item.dateName,
                    year_month: ym,
                  };
                });

              // 캐시 저장
              if (fetchedHolidays.length > 0) {
                await supabase.from("holidays").upsert(
                  fetchedHolidays.map((h) => ({
                    locdate: h.locdate,
                    date_name: h.date_name,
                    is_holiday: true,
                    year_month: h.year_month,
                  })),
                  { onConflict: "locdate" }
                );
              }
            }
          }
        } catch (e) {
          console.error("공공데이터 API 호출 실패:", e);
        }
      }

      // 3. Fallback 데이터 사용
      if (fetchedHolidays.length > 0) {
        holidays = yearMonth
          ? fetchedHolidays.filter((h) => h.year_month === yearMonth)
          : fetchedHolidays;
      } else {
        holidays = DEFAULT_2026_HOLIDAYS.filter((h) => {
          if (yearMonth) return h.year_month === yearMonth;
          return h.year_month.startsWith(year);
        });
      }
    }

    // 월별 집계 (평일 공휴일 기준 및 전체 공휴일 정보)
    const monthlyMap: Record<
      string,
      {
        count: number;
        weekdayCount: number;
        holidays: { date: string; name: string; isWeekday: boolean }[];
      }
    > = {};

    for (const h of holidays) {
      if (!monthlyMap[h.year_month]) {
        monthlyMap[h.year_month] = { count: 0, weekdayCount: 0, holidays: [] };
      }
      const weekday = isWeekday(h.locdate);
      monthlyMap[h.year_month].count += 1;
      if (weekday) {
        monthlyMap[h.year_month].weekdayCount += 1;
      }
      monthlyMap[h.year_month].holidays.push({
        date: `${h.locdate.substring(4, 6)}/${h.locdate.substring(6, 8)}`,
        name: h.date_name,
        isWeekday: weekday,
      });
    }

    return NextResponse.json({
      success: true,
      data: holidays,
      summary: monthlyMap,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}
