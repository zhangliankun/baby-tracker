import { useState, useEffect, useRef, useMemo } from 'react';
import { Milk, Moon, StickyNote, Pill, Apple, Pencil, Trash2, Square } from 'lucide-react';
import { formatTime } from '../utils/date';
import { getRecordSummary, getRecordSubtitle, isSleepRunning, formatElapsed } from '../utils/format';

const iconMap = {
  feeding: { Icon: Milk, bg: 'bg-type-feeding/10' },
  sleep: { Icon: Moon, bg: 'bg-type-sleep/10' },
  diaper: { Icon: StickyNote, bg: 'bg-type-diaper/10' },
  supplement: { Icon: Pill, bg: 'bg-type-supplement/10' },
  'solid-food': { Icon: Apple, bg: 'bg-type-supplement/10' },
};

export default function RecordItem({ record, onEdit, onDelete, onWakeUp }) {
  const { Icon, bg } = iconMap[record.type] || iconMap.feeding;
  const isRunning = record.type === 'sleep' && isSleepRunning(record.data);
  const isLongSleep = record.type === 'sleep' && record.data?.durationMinutes > 360;
  const isTimerCard = !!record.isTimerCard;

  // 动态计时：每秒更新 elapsed
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isTimerCard || !record.data?.startTime) return;
    const tick = () => setElapsed(Date.now() - record.data.startTime);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerCard, record.data?.startTime]);

  const summary = useMemo(() => {
    if (isTimerCard) {
      return `宝宝睡觉中... ${formatElapsed(elapsed)}`;
    }
    return getRecordSummary(record.type, record.data);
  }, [isTimerCard, elapsed, record.type, record.data]);

  const subtitle = useMemo(() => {
    if (isTimerCard) {
      return `开始 ${formatTime(new Date(record.data.startTime))}`;
    }
    return getRecordSubtitle(record.type, record.data);
  }, [isTimerCard, record.type, record.data]);

  return (
    <div
      className={`card flex items-start gap-3 mb-2 transition-colors ${
        isLongSleep ? 'border-l-4 border-l-green-400 bg-green-50/50' : ''
      } ${isTimerCard ? 'border-l-4 border-l-blue-400 bg-blue-50/50' : ''}`}
    >
      {/* 左侧时间 */}
      <div className="text-center min-w-[44px] flex-shrink-0">
        <p className="text-lg font-bold text-text-primary leading-tight">
          {formatTime(record.timestamp)}
        </p>
        <p className="text-[10px] text-text-muted mt-0.5">
          {new Date(record.timestamp).getHours() >= 12 ? 'PM' : 'AM'}
        </p>
      </div>

      {/* 中间内容 */}
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className="w-4 h-4" style={{ color: `var(--type-${record.type})` }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${isTimerCard ? 'text-blue-600 font-medium' : 'text-text-primary'}`}>
            {summary}
          </p>
          {subtitle && (
            <p className={`text-xs mt-0.5 ${isTimerCard ? 'text-blue-500' : 'text-text-muted'}`}>
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            {!isTimerCard && (
              <span className="inline-block px-1.5 py-0.5 rounded-sm bg-brand-secondary-light text-brand-primary text-[10px] font-medium">
                {record.userRole}
              </span>
            )}
            {isLongSleep && (
              <span className="inline-block px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 text-[10px] font-medium">
                长睡眠
              </span>
            )}
            {isTimerCard && (
              <span className="inline-block px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 text-[10px] font-medium">
                计时中
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 右侧操作按钮 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isTimerCard ? (
          <button
            onClick={onWakeUp}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-red-500 text-white text-xs font-medium
                       active:bg-red-600 active:scale-95 transition-all shadow-sm"
          >
            <Square className="w-3.5 h-3.5" fill="white" />
            醒了
          </button>
        ) : (
          <>
            <button
              onClick={() => onEdit(record)}
              className="p-1.5 text-text-muted hover:text-brand-primary rounded-lg hover:bg-brand-secondary-light transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(record)}
              className="p-1.5 text-text-muted hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
