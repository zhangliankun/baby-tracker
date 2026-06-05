import { useState, useMemo } from 'react';
import Picker from 'react-mobile-picker';
import { format, addDays, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 底部滚轮时间选择器
 * 三列：日期（近7天）、小时（0-23）、分钟（0-59）
 */
export default function DateTimePicker({ title, initialValue, isClearable, onConfirm, onCancel, onClear }) {
  const now = useMemo(() => new Date(), []);

  // 生成近7天日期选项
  const dateOptions = useMemo(() => {
    const opts = [];
    for (let i = -1; i <= 5; i++) {
      const d = addDays(now, i);
      let label;
      if (isToday(d)) {
        label = format(d, 'M月d日') + '(今天)';
      } else if (isYesterday(d)) {
        label = format(d, 'M月d日') + '(昨天)';
      } else {
        label = format(d, 'M月d日 EEE');
      }
      opts.push({
        value: format(d, 'yyyy-MM-dd'),
        label,
      });
    }
    return opts;
  }, [now]);

  // 小时选项 0-23
  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      value: String(i),
      label: String(i).padStart(2, '0'),
    }));
  }, []);

  // 分钟选项 0-59（步长5）
  const minuteOptions = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      value: String(i),
      label: String(i).padStart(2, '0'),
    }));
  }, []);

  const initDate = initialValue || now;
  const [pickerValue, setPickerValue] = useState({
    date: format(initDate, 'yyyy-MM-dd'),
    hour: String(initDate.getHours()),
    minute: String(initDate.getMinutes()),
  });

  const handleConfirm = () => {
    onConfirm(pickerValue);
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30" onClick={onCancel}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl shadow-modal animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
          <button onClick={handleClear} className="text-sm text-text-secondary">取消</button>
          <span className="text-sm font-medium text-text-primary">{title || '选择时间'}</span>
          <button onClick={handleConfirm} className="text-sm font-medium text-brand-primary">确定</button>
        </div>

        {/* 滚轮选择器 */}
        <div className="px-0 py-2" style={{ height: 216 }}>
          <Picker
            value={pickerValue}
            onChange={setPickerValue}
            wheelMode="normal"
          >
            <Picker.Column name="date">
              {dateOptions.map((opt) => (
                <Picker.Item key={opt.value} value={opt.value}>
                  {({ selected }) => (
                    <span style={{ color: selected ? '#FF9A8B' : '#8E8E93', fontSize: selected ? 16 : 14 }}>
                      {opt.label}
                    </span>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>

            <Picker.Column name="hour">
              {hourOptions.map((opt) => (
                <Picker.Item key={opt.value} value={opt.value}>
                  {({ selected }) => (
                    <span style={{ color: selected ? '#FF9A8B' : '#8E8E93', fontSize: selected ? 16 : 14 }}>
                      {opt.label}时
                    </span>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>

            <Picker.Column name="minute">
              {minuteOptions.map((opt) => (
                <Picker.Item key={opt.value} value={opt.value}>
                  {({ selected }) => (
                    <span style={{ color: selected ? '#FF9A8B' : '#8E8E93', fontSize: selected ? 16 : 14 }}>
                      {opt.label}分
                    </span>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>
      </div>
    </div>
  );
}
