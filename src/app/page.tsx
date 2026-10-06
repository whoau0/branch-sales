import Link from "next/link";
import { Coffee, Store, LayoutDashboard } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-800 mb-2">
          <Coffee className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">오늘의원두</h1>
          <p className="text-sm text-slate-500 mt-1">지점 매출 및 공휴일 분석 시스템</p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/input"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-all shadow-md shadow-amber-600/20"
          >
            <Store className="w-5 h-5" />
            지점장 매출 입력 바로가기
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all shadow-md shadow-slate-800/20"
          >
            <LayoutDashboard className="w-5 h-5" />
            대표 / 본사 대시보드 조회
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
          대상 지점: 용산역점 · 삼각지점 · 이태원점 · 효창공원점 · 한남점
        </div>
      </div>
    </main>
  );
}
