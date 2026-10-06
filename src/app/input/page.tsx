"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Coffee,
  Store,
  KeyRound,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Lock,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

const BRANCHES = [
  "용산역점",
  "삼각지점",
  "이태원점",
  "효창공원점",
  "한남점",
];

export default function BranchInputPage() {
  // 인증 상태
  const [selectedBranch, setSelectedBranch] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 폼 입력 상태
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const [month, setMonth] = useState("2026-09");
  const [revenueInput, setRevenueInput] = useState("");
  const [customersInput, setCustomersInput] = useState("");
  const [notes, setNotes] = useState("");

  // 상태 플래그
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [existingRecord, setExistingRecord] = useState<any | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 토스트 타이머
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // PIN 인증 요청
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!selectedBranch) {
      setAuthError("지점을 선택해 주세요.");
      return;
    }
    if (!pinCode) {
      setAuthError("PIN 번호를 입력해 주세요.");
      return;
    }

    setIsAuthenticating(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch: selectedBranch, pin: pinCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        // 로그인 성공 시 해당 월의 기존 데이터 조회
        checkExistingData(selectedBranch, month);
      } else {
        setAuthError(data.message || "PIN 번호가 일치하지 않습니다.");
      }
    } catch (err) {
      setAuthError("인증 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinCode("");
    setRevenueInput("");
    setCustomersInput("");
    setNotes("");
    setExistingRecord(null);
  };

  // 월 또는 지점 변경 시 기존 데이터 자동 조회
  const checkExistingData = async (branchName: string, targetMonth: string) => {
    if (!branchName || !targetMonth) return;
    setIsCheckingExisting(true);
    try {
      const res = await fetch(
        `/api/sales?branch=${encodeURIComponent(branchName)}&month=${targetMonth}`
      );
      const result = await res.json();
      if (res.ok && result.data && result.data.length > 0) {
        const record = result.data[0];
        setExistingRecord(record);
        setRevenueInput(formatNumber(record.매출액));
        setCustomersInput(formatNumber(record.객수));
        setNotes(record.비고 || "");
      } else {
        setExistingRecord(null);
        setRevenueInput("");
        setCustomersInput("");
        setNotes("");
      }
    } catch (err) {
      console.error("기존 데이터 조회 실패:", err);
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMonth = e.target.value;
    setMonth(newMonth);
    if (isAuthenticated && selectedBranch) {
      checkExistingData(selectedBranch, newMonth);
    }
  };

  // 금액 입력 시 실시간 콤마 처리
  const handleRevenueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (rawValue === "") {
      setRevenueInput("");
      return;
    }
    const num = parseInt(rawValue, 10);
    setRevenueInput(formatNumber(num));
  };

  // 객수 입력 시 실시간 콤마 처리
  const handleCustomersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (rawValue === "") {
      setCustomersInput("");
      return;
    }
    const num = parseInt(rawValue, 10);
    setCustomersInput(formatNumber(num));
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!revenueInput) {
      setToastMessage({ type: "error", text: "매출액을 입력해 주세요." });
      return;
    }
    if (!customersInput) {
      setToastMessage({ type: "error", text: "객수를 입력해 주세요." });
      return;
    }

    if (existingRecord) {
      setShowConfirmModal(true);
    } else {
      executeSave();
    }
  };

  // 실제 DB 저장 (Upsert)
  const executeSave = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    const rawRevenue = parseInt(revenueInput.replace(/,/g, ""), 10);
    const rawCustomers = parseInt(customersInput.replace(/,/g, ""), 10);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          월: month,
          지점: selectedBranch,
          매출액: rawRevenue,
          객수: rawCustomers,
          비고: notes,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setToastMessage({
          type: "success",
          text: `[${selectedBranch}] ${month}월 매출 데이터가 성공적으로 저장되었습니다.`,
        });
        checkExistingData(selectedBranch, month);
      } else {
        setToastMessage({
          type: "error",
          text: result.message || "저장에 실패했습니다.",
        });
      }
    } catch (err) {
      setToastMessage({
        type: "error",
        text: "네트워크 오류로 저장하지 못했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Coffee className="w-5 h-5 text-amber-600" />
            <span>오늘의원두 지점 관리</span>
          </div>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto p-4 flex-1 flex flex-col justify-center">
        {!isAuthenticated ? (
          /* Step 1: 지점 선택 및 PIN 번호 인증 */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-600 mb-1">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">지점장 인증</h2>
              <p className="text-sm text-slate-500">
                매출 입력을 위해 지점을 선택하고 간이 PIN 번호를 입력해 주세요.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  지점 선택
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                    required
                  >
                    <option value="">지점을 선택하세요</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  간이 PIN 번호
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="4~6자리 숫자 PIN 입력"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition tracking-widest placeholder:tracking-normal"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 pl-1">
                  * 각 지점 초기 PIN: 1111(용산), 2222(삼각지), 3333(이태원), 4444(효창), 5555(한남)
                </p>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold rounded-xl transition shadow-md shadow-amber-600/20 mt-2 flex items-center justify-center gap-2"
              >
                {isAuthenticating && <RefreshCw className="w-4 h-4 animate-spin" />}
                지점 인증 및 로그인
              </button>
            </form>
          </div>
        ) : (
          /* Step 2: 지점 매출 입력 폼 */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="inline-block text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full mb-1">
                  인증 완료
                </span>
                <h2 className="text-xl font-bold text-slate-900">{selectedBranch}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">기준 연월</span>
                <div className="font-semibold text-slate-800">{month}</div>
              </div>
            </div>

            {existingRecord && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <span className="font-semibold">{month}월 데이터가 이미 등록되어 있습니다.</span>
                  <p className="text-blue-600 mt-0.5">
                    내용을 변경하고 저장하면 기존 데이터가 최신 정보로 업데이트(수정)됩니다.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. 대상 월 선택 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  대상 월 (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={handleMonthChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                  required
                />
              </div>

              {/* 2. 매출액 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  당월 총 매출액 (원)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 54,320,000"
                    value={revenueInput}
                    onChange={handleRevenueChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition pr-10"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-semibold text-slate-400">
                    원
                  </span>
                </div>
              </div>

              {/* 3. 객수 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  당월 총 객수 (명)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="예: 6,820"
                    value={customersInput}
                    onChange={handleCustomersChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition pr-10"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-sm font-semibold text-slate-400">
                    명
                  </span>
                </div>
              </div>

              {/* 4. 비고 입력 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  비고 / 특이사항 (선택)
                </label>
                <textarea
                  rows={3}
                  placeholder="예: 추석 연휴 3일 단축 영업, 인근 매장 리뉴얼 오픈 등"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition resize-none"
                />
              </div>

              {/* 저장 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting || isCheckingExisting}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-bold rounded-xl transition shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 mt-4 text-base"
              >
                {isSubmitting && <RefreshCw className="w-5 h-5 animate-spin" />}
                {existingRecord ? "매출 정보 수정 저장하기" : "당월 매출 등록하기"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* 수정 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">기존 데이터 수정</h3>
              <p className="text-xs text-slate-500">
                [{selectedBranch}]의 {month}월 매출 데이터가 이미 등록되어 있습니다. 입력하신 새로운 내용으로 덮어쓸까요?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
              >
                취소
              </button>
              <button
                onClick={executeSave}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition shadow"
              >
                수정 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400">
        오늘의원두 지점 매출 관리 시스템 © 2026
      </footer>
    </div>
  );
}
