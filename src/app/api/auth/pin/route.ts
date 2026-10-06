import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { branch, pin } = await request.json();

    if (!branch || !pin) {
      return NextResponse.json(
        { success: false, message: "지점과 PIN 번호를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("branches")
      .select("id, branch_name, pin_code")
      .eq("branch_name", branch)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "등록되지 않은 지점이거나 조회에 실패했습니다." },
        { status: 404 }
      );
    }

    if (data.pin_code !== pin) {
      return NextResponse.json(
        { success: false, message: "PIN 번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      branch: data.branch_name,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
