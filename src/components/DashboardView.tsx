"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Coffee,
  Store,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter,
  ArrowUpDown,
  RefreshCw,
  BarChart3,
  Sparkles,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { SaleRecord } from "@/types";

interface HolidaySummary {
  count: number;
  weekdayCount: number;
  holidays: { date: string; name: string; isWeekday: boolean }[];
}

export default function DashboardView({ secretToken }: { secretToken?: string }) {
  const [salesData, setSalesData] = useState<SaleRecord[]>([]);
  const [holidaysSummary, setHolidaysSummary] = useState<Record<string, HolidaySummary>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonthForBranchComp, setSelectedMonthForBranchComp] = useState<string>("");

  // 테이블 필터 및 정렬 상태
  const [tableBranchFilter, setTableBranchFilter] = useState<string>("ALL");
  const [tableMonthFilter, setTableMonthFilter] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<"월" | "지점" | "매출액" | "객수" | "객단가">("월");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // 데이터 로드
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, holidaysRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/holidays?year=2026"),
      ]);

      const salesJson = await salesRes.json();
      const holidaysJson = await holidaysRes.json();

      if (salesJson.success && salesJson.data) {
        setSalesData(salesJson.data);
      }
      if (holidaysJson.success && holidaysJson.summary) {
        setHolidaysSummary(holidaysJson.summary);
      }
    } catch (error) {
      console.error("대시보드 데이터 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 가용 연월 목록 (정렬)
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(salesData.map((d) => d.월))).sort();
    return months;
  }, [salesData]);

  // 최신 월 기본 설정
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonthForBranchComp) {
      setSelectedMonthForBranchComp(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedMonthForBranchComp]);

  // 1. KPI 지표 계산
  const latestMonth = availableMonths[availableMonths.length - 1] || "2026-08";
  const prevMonth =
    availableMonths.length >= 2 ? availableMonths[availableMonths.length - 2] : null;

  const kpiData = useMemo(() => {
    if (!latestMonth) return null;

    const latestSales = salesData.filter((d) => d.월 === latestMonth);
    const prevSales = prevMonth ? salesData.filter((d) => d.월 === prevMonth) : [];

    const totalRevenue = latestSales.reduce((sum, d) => sum + Number(d.매출액), 0);
    const prevTotalRevenue = prevSales.reduce((sum, d) => sum + Number(d.매출액), 0);

    const totalCustomers = latestSales.reduce((sum, d) => sum + Number(d.객수), 0);
    const avgTicket = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

    const revenueGrowthRate =
      prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : 0;

    const holidayInfo = holidaysSummary[latestMonth] || {
      count: 0,
      weekdayCount: 0,
      holidays: [],
    };

    return {
      latestMonth,
      totalRevenue,
      prevTotalRevenue,
      revenueGrowthRate,
      totalCustomers,
      avgTicket,
      holidayCount: holidayInfo.count,
      holidayNames: holidayInfo.holidays.map((h) => `${h.name}(${h.date})`).join(", "),
    };
  }, [salesData, holidaysSummary, latestMonth, prevMonth]);

  // 2. 월별 전체 매출 & 공휴일 복합 차트 데이터
  const monthlyChartData = useMemo(() => {
    return availableMonths.map((m) => {
      const monthSales = salesData.filter((d) => d.월 === m);
      const totalRev = monthSales.reduce((acc, cur) => acc + Number(cur.매출액), 0);
      const totalCust = monthSales.reduce((acc, cur) => acc + Number(cur.객수), 0);
      const holidayInfo = holidaysSummary[m] || { count: 0, weekdayCount: 0, holidays: [] };

      return {
        월: m,
        총매출액: totalRev,
        총매출_백만원: Math.round(totalRev / 10000) / 100, // 백만원 단위
        총객수: totalCust,
        공휴일수: holidayInfo.count,
        공휴일목록: holidayInfo.holidays.map((h) => `${h.name}(${h.date})`).join(", ") || "공휴일 없음",
      };
    });
  }, [availableMonths, salesData, holidaysSummary]);

  // 3. 지점별 실적 비교 차트 데이터 (선택된 월 기준)
  const branchChartData = useMemo(() => {
    if (!selectedMonthForBranchComp) return [];
    const filtered = salesData.filter((d) => d.월 === selectedMonthForBranchComp);
    return filtered.map((d) => ({
      지점: d.지점,
      매출액: Number(d.매출액),
      매출_백만원: Math.round(Number(d.매출액) / 10000) / 100,
      객수: Number(d.객수),
      객단가: Number(d.객수) > 0 ? Math.round(Number(d.매출액) / Number(d.객수)) : 0,
      비고: d.비고,
    }));
  }, [salesData, selectedMonthForBranchComp]);

  // 4. 상세 데이터 테이블 가공 및 정렬
  const processedTableData = useMemo(() => {
    let result = salesData.map((d) => {
      const rev = Number(d.매출액);
      const cust = Number(d.객수);
      const avg = cust > 0 ? Math.round(rev / cust) : 0;
      return {
        ...d,
        매출액: rev,
        객수: cust,
        객단가: avg,
      };
    });

    if (tableBranchFilter !== "ALL") {
      result = result.filter((d) => d.지점 === tableBranchFilter);
    }
    if (tableMonthFilter !== "ALL") {
      result = result.filter((d) => d.월 === tableMonthFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      } else {
        return sortOrder === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    return result;
  }, [salesData, tableBranchFilter, tableMonthFilter, sortKey, sortOrder]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // CSV 다운로드 핸들러
  const handleDownloadCSV = () => {
    if (processedTableData.length === 0) return;

    const headers = ["월", "지점", "매출액", "객수", "객단가", "비고"];
    const rows = processedTableData.map((row) => [
      `"${row.월}"`,
      `"${row.지점}"`,
      row.매출액,
      row.객수,
      row.객단가,
      `"${(row.비고 || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `오늘의원두_매출데이터_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const branchList = ["용산역점", "삼각지점", "이태원점", "효창공원점", "한남점"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="메인으로"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold shadow">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  오늘의원두 매출 분석 대시보드
                  {secretToken && (
                    <span className="text-[11px] font-normal px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full">
                      임원 전용 뷰
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-400">실시간 5개 지점 실적 및 공휴일 분석</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <Link
              href="/input"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition shadow-sm"
            >
              <Store className="w-3.5 h-3.5" />
              매출 입력
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top KPI Cards */}
        {kpiData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: 당월 총매출 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{kpiData.latestMonth} 전 지점 총매출</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(kpiData.totalRevenue)}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
                {kpiData.revenueGrowthRate >= 0 ? (
                  <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />+
                    {kpiData.revenueGrowthRate.toFixed(1)}%
                  </span>
                ) : (
                  <span className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-semibold">
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                    {kpiData.revenueGrowthRate.toFixed(1)}%
                  </span>
                )}
                <span className="text-slate-400">전월 대비</span>
              </div>
            </div>

            {/* KPI 2: 당월 총 객수 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{kpiData.latestMonth} 총 방문 고객수</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatNumber(kpiData.totalCustomers)}
                </span>
                <span className="text-sm font-semibold text-slate-500">명</span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                5개 전 지점 누적 방문객
              </div>
            </div>

            {/* KPI 3: 평균 객단가 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{kpiData.latestMonth} 평균 객단가</span>
                <span className="p-2 rounded-xl bg-violet-50 text-violet-700">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(kpiData.avgTicket)}
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                매출액 ÷ 총 객수 기준
              </div>
            </div>

            {/* KPI 4: 당월 공휴일 정보 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{kpiData.latestMonth} 법정 공휴일</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {kpiData.holidayCount}
                </span>
                <span className="text-sm font-semibold text-slate-500">일</span>
              </div>
              <div className="mt-3 text-xs text-slate-500 truncate" title={kpiData.holidayNames}>
                {kpiData.holidayNames || "공휴일 없음"}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: 월별 전체 매출 추이 & 공휴일 복합 차트 (8 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  월별 전체 매출 추이 & 공휴일 복합 분석
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  총매출액(막대)과 해당 월 공휴일 일수(꺾은선) 상관관계
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="월"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickLine={false}
                  />
                  {/* Left Y Axis: Revenue (백만원) */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={(val) => `${val}백만`}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* Right Y Axis: Holidays (Days) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 6]}
                    tick={{ fontSize: 12, fill: "#ef4444" }}
                    tickFormatter={(val) => `${val}일`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "총매출액") return [formatCurrency(Number(value)), "월 총매출"];
                      if (name === "공휴일수") return [`${value}일`, "법정 공휴일 수"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const item = monthlyChartData.find((d) => d.월 === label);
                      return `${label} (${item?.공휴일목록 || ""})`;
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="총매출액"
                    name="총매출액"
                    fill="#d97706"
                    radius={[6, 6, 0, 0]}
                    barSize={32}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="공휴일수"
                    name="공휴일수"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#ef4444" }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: 지점별 실적 비교 차트 (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">지점별 실적 비교</h3>
                <p className="text-xs text-slate-400 mt-0.5">지점별 매출 및 객수 비교</p>
              </div>

              {/* Month Selector */}
              <div className="relative">
                <select
                  value={selectedMonthForBranchComp}
                  onChange={(e) => setSelectedMonthForBranchComp(e.target.value)}
                  className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 px-3 pr-7 rounded-lg appearance-none cursor-pointer outline-none transition"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={branchChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(val) => `${Math.round(val / 1000000)}백만`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="지점"
                    tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => {
                      if (name === "매출액") return [formatCurrency(Number(value)), "매출액"];
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="매출액"
                    name="매출액"
                    fill="#3b82f6"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Data Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">상세 매출 내역</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                지점별/월별 상세 실적 목록 및 특이사항 (총 {processedTableData.length}건)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={tableBranchFilter}
                  onChange={(e) => setTableBranchFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="ALL">전체 지점</option>
                  {branchList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={tableMonthFilter}
                  onChange={(e) => setTableMonthFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer font-medium"
                >
                  <option value="ALL">전체 기간</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                엑셀(CSV) 저장
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600">
                  <th
                    onClick={() => toggleSort("월")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      월 {sortKey === "월" && <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("지점")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center gap-1">
                      지점 {sortKey === "지점" && <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("매출액")}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-end gap-1">
                      매출액 {sortKey === "매출액" && <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("객수")}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-end gap-1">
                      객수 {sortKey === "객수" && <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("객단가")}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition"
                  >
                    <div className="flex items-center justify-end gap-1">
                      객단가 {sortKey === "객단가" && <ArrowUpDown className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left">비고 (특이사항)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {processedTableData.length > 0 ? (
                  processedTableData.map((row, idx) => (
                    <tr key={`${row.지점}-${row.월}-${idx}`} className="hover:bg-amber-50/30 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{row.월}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                          {row.지점}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(row.매출액)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatNumber(row.객수)}명
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatCurrency(row.객단가)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {row.비고 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800">
                            {row.비고}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      조건에 해당하는 매출 데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
