export interface Branch {
  id: number;
  branch_name: string;
  pin_code?: string;
  created_at?: string;
}

export interface SaleRecord {
  id?: number | string;
  월: string;
  지점: string;
  매출액: number;
  객수: number;
  비고: string | null;
  created_at?: string;
}

export interface HolidayRecord {
  id?: number;
  locdate: string; // YYYYMMDD
  date_name: string;
  is_holiday: boolean;
  year_month: string; // YYYY-MM
}

export interface MonthlyHolidaySummary {
  yearMonth: string;
  count: number;
  holidays: {
    date: string;
    name: string;
  }[];
}
