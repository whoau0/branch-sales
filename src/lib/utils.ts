import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}
