import {
  format,
  parseISO,
  differenceInDays,
  differenceInMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isToday,
  isYesterday,
  addDays,
  subDays,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化时间戳为 HH:mm（如 10:04）
 */
export function formatTime(timestamp) {
  return format(new Date(timestamp), 'HH:mm');
}

/**
 * 格式化时间戳为显示时间（如"10:04 AM"）
 */
export function formatTimeWithPeriod(timestamp) {
  return format(new Date(timestamp), 'hh:mm a');
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date) {
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
}

/**
 * 格式化日期为中文显示（如"6月4日"）
 */
export function formatDateCN(date) {
  return format(typeof date === 'string' ? parseISO(date) : date, 'M月d日');
}

/**
 * 格式化日期为"今天"、"昨天"或具体日期
 */
export function formatDateRelative(dateStr) {
  const d = parseISO(dateStr);
  if (isToday(d)) return '今天';
  if (isYesterday(d)) return '昨天';
  return formatDateCN(d);
}

/**
 * 根据出生日期计算年龄（"X个月Y天"）
 */
export function calcAge(birthDateStr) {
  const birth = parseISO(birthDateStr);
  const now = new Date();

  // 先算整月数
  let months = differenceInMonths(now, birth);
  // 算出从出生日期加 months 个月后的日期
  const monthsAdded = new Date(birth);
  monthsAdded.setMonth(monthsAdded.getMonth() + months);
  const remainingDays = differenceInDays(now, monthsAdded);

  return { months, days: remainingDays };
}

/**
 * 格式化年龄为中文（如"6个月11天"）
 */
export function formatAge(birthDateStr) {
  const { months, days } = calcAge(birthDateStr);
  if (months < 1) {
    return `${Math.max(0, days)}天`;
  }
  return `${months}个月${days}天`;
}

/**
 * 获取本周起止日期（周一~周日）
 */
export function getWeekRange(date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: formatDate(startOfWeek(d, { weekStartsOn: 1 })),
    end: formatDate(endOfWeek(d, { weekStartsOn: 1 })),
  };
}

/**
 * 获取本月起止日期
 */
export function getMonthRange(date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: formatDate(startOfMonth(d)),
    end: formatDate(endOfMonth(d)),
  };
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD
 */
export function getToday() {
  return formatDate(new Date());
}

/**
 * 获取昨天的日期字符串
 */
export function getYesterday() {
  return formatDate(subDays(new Date(), 1));
}

/**
 * 判断日期是否为"更早"（非今天非昨天）
 */
export function isOlder(dateStr) {
  const d = parseISO(dateStr);
  return !isToday(d) && !isYesterday(d);
}

export { parseISO, isToday, isYesterday };
