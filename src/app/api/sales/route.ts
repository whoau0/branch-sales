import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branch = searchParams.get("branch");
    const month = searchParams.get("month");

    let query = supabase.from("sales").select("*").order("월", { ascending: true });

    if (branch) {
      query = query.eq("지점", branch);
    }
    if (month) {
      query = query.eq("월", month);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 월, 지점, 매출액, 객수, 비고 } = body;

    if (!월 || !지점 || 매출액 === undefined || 객수 === undefined) {
      return NextResponse.json(
        { success: false, message: "필수 입력 항목(월, 지점, 매출액, 객수)이 누락되었습니다." },
        { status: 400 }
      );
    }

    const parsedRevenue = Number(매출액);
    const parsedCustomers = Number(객수);

    if (isNaN(parsedRevenue) || isNaN(parsedCustomers)) {
      return NextResponse.json(
        { success: false, message: "매출액과 객수는 유효한 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // Upsert into sales table based on (지점, 월)
    const { data, error } = await supabase
      .from("sales")
      .upsert(
        {
          월,
          지점,
          매출액: parsedRevenue,
          객수: parsedCustomers,
          비고: 비고?.trim() || null,
        },
        { onConflict: "지점,월" }
      )
      .select();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "매출 데이터 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
