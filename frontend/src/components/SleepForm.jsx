import { useState, useEffect, useRef } from 'react';
import { X, Play, Square } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { formatDuration, formatElapsed } from '../utils/format';
import { sleepTimerAPI, recordsAPI } from '../services/api';
import { getToday } from '../utils/date';
import DateTimePicker from './DateTimePicker';

function formatDisplay(date) {
  return format(date, 'M月d日 HH:mm', { locale: zhCN });
}

function pickerValueToDate(pv) {
  const [y, m, d] = pv.date.split('-').map(Number);
  return new Date(y, m - 1, d, Number(pv.hour), Number(pv.minute));
}

const QUICK_DURATIONS = [
  { min: 15, label: '15分' },
  { min: 30, label: '30分' },
  { min: 60, label: '1时' },
  { min: 90, label: '1.5时' },
  { min: 120, label: '2时' },
  { min: 180, label: '3时' },
];

export default function SleepForm({ initialData, onClose, onStartTimer, onTimerSaved, onSubmit, timerStopData }) {
  const [mode, setMode] = useState('timer');
  const [startTime, setStartTime] = useState(() => {
    if (initialData?.data?.startTime) return new Date(initialData.data.startTime);
    if (timerStopData?.startTime) return new Date(timerStopData.startTime);
    return new Date();
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialData?.data?.endTime) return new Date(initialData.data.endTime);
    if (timerStopData?.endTime) return new Date(timerStopData.endTime);
    return new Date();
  });
  const [remark, setRemark] = useState(initialData?.data?.remark || '');
  const [saving, setSaving] = useState(false);
  const [lastTimeAgo, setLastTimeAgo] = useState(null);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerJustStopped, setTimerJustStopped] = useState(false);
  const timerRef = useRef(null);

  const [pickerTarget, setPickerTarget] = useState(null);

  const isEdit = !!initialData;
  const isTimerRecord = !!(!initialData?.data?.endTime && !initialData?.data?.durationMinutes && initialData?.data?.startTime);
  // timerStopData 存在说明是从"宝宝醒了"进来的，直接显示手动面板
  const isFromWakeUp = !!timerStopData;

  useEffect(() => {
    if (isFromWakeUp) {
      setMode('manual');
      setTimerJustStopped(true);
      return;
    }
    if (isTimerRecord) {
      setMode('timer');
      setTimerRunning(true);
      setTimerStartTime(initialData.data.startTime);
      return;
    }
    if (isEdit) { setMode('manual'); return; }
    sleepTimerAPI.status().then(res => {
      if (res.success && res.data) {
        setMode('timer');
        setTimerRunning(true);
        setTimerStartTime(res.data.startTime);
        setStartTime(new Date(res.data.startTime));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    recordsAPI.getByDate(getToday()).then(res => {
      if (res.success) {
        const last = res.data.find(r => r.type === 'sleep');
        if (last) {
          const agoMin = Math.floor((Date.now() - last.timestamp) / 60000);
          setLastTimeAgo(formatDuration(agoMin));
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (timerRunning && timerStartTime) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - timerStartTime), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timerStartTime]);

  const handleStartTimer = async () => {
    try {
      const res = await sleepTimerAPI.start();
      if (res.success) {
        setTimerRunning(true);
        setTimerStartTime(res.data.startTime);
        if (onStartTimer) onStartTimer();
      }
    } catch (err) {}
  };

  const handleStopTimer = async () => {
    try {
      const res = await sleepTimerAPI.stop();
      if (res.success) {
        setTimerRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setEndTime(new Date(res.data.endTime));
        setStartTime(new Date(res.data.startTime));
        setTimerJustStopped(true);
        setMode('manual');
      }
    } catch (err) {}
  };

  const handleQuickDuration = (min) => setEndTime(new Date(startTime.getTime() + min * 60000));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (startTime >= endTime) return;
    setSaving(true);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const payload = {
      type: 'sleep',
      timestamp: startTime.getTime(),
      data: {
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        durationMinutes,
        ...(remark.trim() && { remark: remark.trim() }),
      },
    };
    if (onTimerSaved && (timerJustStopped || !isEdit)) {
      await onTimerSaved(payload);
    } else if (onSubmit) {
      await onSubmit(payload);
    }
    setSaving(false);
  };

  const durationMinutes = startTime < endTime ? Math.round((endTime - startTime) / 60000) : 0;
  const totalSec = Math.floor(elapsed / 1000);
  const dh = Math.floor(totalSec / 3600);
  const dm = Math.floor((totalSec % 3600) / 60);
  const ds = totalSec % 60;
  const timeDisplay = dh > 0
    ? `${String(dh).padStart(2,'0')}:${String(dm).padStart(2,'0')}:${String(ds).padStart(2,'0')}`
    : `${String(dm).padStart(2,'0')}:${String(ds).padStart(2,'0')}`;

  const showTimerTab = !isEdit && !timerJustStopped && !isFromWakeUp;
  const showManual = mode === 'manual' || isEdit || timerJustStopped || isFromWakeUp;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
        <div className="w-full max-w-md bg-white rounded-t-2xl shadow-modal animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <div>
              <h2 className="text-h3 text-text-primary">{isEdit && !isTimerRecord ? '编辑睡眠' : '睡眠'}</h2>
              {lastTimeAgo && <p className="text-xs text-text-muted mt-0.5">上次：{lastTimeAgo}前</p>}
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {showTimerTab && (
              <div className="flex rounded-lg bg-bg-page p-1">
                <button type="button" onClick={() => setMode('timer')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'timer' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-secondary'}`}>计时</button>
                <button type="button" onClick={() => setMode('manual')}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-white text-brand-primary shadow-sm' : 'text-text-secondary'}`}>手动输入</button>
              </div>
            )}

            {/* 计时面板 */}
            {mode === 'timer' && showTimerTab && (
              <div className="flex flex-col items-center py-6">
                {timerRunning ? (
                  <>
                    <div className="text-[56px] font-bold text-brand-primary tabular-nums leading-tight mb-2 font-mono">{timeDisplay}</div>
                    <p className="text-sm text-text-secondary mb-1">{formatElapsed(elapsed)}</p>
                    <p className="text-xs text-text-muted mb-2">宝宝睡觉中...</p>
                    <p className="text-xs text-text-secondary mb-4">
                      开始时间 {format(startTime, 'M月d日 HH:mm', { locale: zhCN })}
                    </p>
                    <button type="button" onClick={handleStopTimer}
                      className="flex items-center gap-2 px-8 py-3 rounded-full bg-red-500 text-white font-semibold shadow-lg active:scale-95 transition-transform">
                      <Square className="w-5 h-5" fill="white" /> 宝宝醒了
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[56px] font-bold text-text-muted tabular-nums leading-tight mb-2 font-mono">00:00</div>
                    <p className="text-sm text-text-secondary mb-6">点击开始记录睡眠</p>
                    <button type="button" onClick={handleStartTimer}
                      className="flex items-center gap-2 px-8 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg active:scale-95 transition-transform">
                      <Play className="w-5 h-5" fill="white" /> 睡了
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 手动面板 / 计时停止后确认面板 */}
            {showManual && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {timerJustStopped && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-green-700 font-medium">计时已停止</p>
                    <p className="text-xs text-green-600 mt-1">本次睡眠 {formatDuration(durationMinutes)}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">开始时间</label>
                  <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('start')}>
                    <span className="text-sm">{formatDisplay(startTime)}</span>
                    <span className="text-xs text-text-muted">选择 ▸</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">结束时间</label>
                  <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('end')}>
                    <span className="text-sm">{formatDisplay(endTime)}</span>
                    <span className="text-xs text-text-muted">选择 ▸</span>
                  </div>
                </div>

                <div>
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_DURATIONS.map(d => (
                      <button key={d.min} type="button" onClick={() => handleQuickDuration(d.min)}
                        className="px-3 py-1.5 rounded-full text-xs border border-border-light text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors">{d.label}</button>
                    ))}
                  </div>
                </div>

                {durationMinutes > 0 && (
                  <div className="flex items-center justify-center py-3 bg-brand-secondary-light rounded-lg">
                    <span className="text-sm text-text-secondary mr-2">总时长</span>
                    <span className="text-h2 text-brand-primary">{formatDuration(durationMinutes)}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">备注（可选）</label>
                  <textarea className="input-field" placeholder="如：宝宝睡得安稳" rows={2} value={remark} onChange={e => setRemark(e.target.value)} />
                </div>

                {startTime >= endTime && <p className="text-center text-xs text-red-400">开始时间必须早于结束时间</p>}

                <div className="flex gap-3 pt-2 pb-2">
                  <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">取消</button>
                  <button type="submit" disabled={saving || startTime >= endTime}
                    className={`flex-1 py-2.5 rounded-full font-semibold text-white transition-all active:scale-[0.98] ${
                      timerJustStopped ? 'bg-green-500 hover:bg-green-600' : 'bg-brand-primary'
                    } disabled:opacity-50`}>
                    {saving ? '保存中...' : timerJustStopped ? '结束并保存' : '保存'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {pickerTarget && (
        <DateTimePicker
          title={pickerTarget === 'start' ? '开始时间' : '结束时间'}
          initialValue={pickerTarget === 'start' ? startTime : endTime}
          onConfirm={(pv) => {
            const d = pickerValueToDate(pv);
            if (pickerTarget === 'start') setStartTime(d);
            else setEndTime(d);
            setPickerTarget(null);
          }}
          onCancel={() => setPickerTarget(null)}
        />
      )}
    </>
  );
}
