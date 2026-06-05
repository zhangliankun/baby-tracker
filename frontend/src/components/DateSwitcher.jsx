import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDate, getToday, getYesterday, formatDateCN, parseISO } from '../utils/date';

export default function DateSwitcher({ selectedDate, onDateChange }) {
  const [showPicker, setShowPicker] = useState(false);

  const today = getToday();
  const yesterday = getYesterday();
  const isToday = selectedDate === today;
  const isYesterday = selectedDate === yesterday;

  const goPrev = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onDateChange(formatDate(d));
  };

  const goNext = () => {
    if (isToday) return;
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onDateChange(formatDate(d));
  };

  const setToday = () => onDateChange(today);
  const setYesterday = () => onDateChange(yesterday);

  const handleDateInput = (e) => {
    onDateChange(e.target.value);
    setShowPicker(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 mb-4">
      {/* 快捷切换按钮 */}
      <div className="flex items-center gap-1 bg-white rounded-full px-1 py-1 shadow-sm border border-border-light">
        <button
          onClick={setYesterday}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isYesterday
              ? 'bg-brand-primary text-white'
              : 'text-text-secondary hover:text-brand-primary'
          }`}
        >
          昨天
        </button>
        <button
          onClick={setToday}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isToday
              ? 'bg-brand-primary text-white'
              : 'text-text-secondary hover:text-brand-primary'
          }`}
        >
          今天
        </button>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`p-1.5 rounded-full text-text-secondary hover:text-brand-primary transition-colors`}
          title="选择日期"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* 日期选择器行 */}
      <div className="flex items-center gap-3">
        <button onClick={goPrev} className="p-1 text-text-secondary hover:text-brand-primary">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-text-primary min-w-[80px] text-center">
          {isToday ? '今天' : isYesterday ? '昨天' : formatDateCN(parseISO(selectedDate))}
        </span>
        <button
          onClick={goNext}
          className={`p-1 ${isToday ? 'text-text-muted cursor-not-allowed' : 'text-text-secondary hover:text-brand-primary'}`}
          disabled={isToday}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 日历选择器 */}
      {showPicker && (
        <div className="animate-slide-down">
          <input
            type="date"
            className="input-field text-sm"
            value={selectedDate}
            max={today}
            onChange={handleDateInput}
          />
        </div>
      )}
    </div>
  );
}
