import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FEEDING_TYPES, AMOUNT_PRESETS } from '../utils/constants';
import { recordsAPI } from '../services/api';
import { formatDuration } from '../utils/format';
import { getToday } from '../utils/date';
import DateTimePicker from './DateTimePicker';

function formatDisplay(date) {
  return format(date, 'M月d日 HH:mm', { locale: zhCN });
}

function pickerValueToDate(pv) {
  const [y, m, d] = pv.date.split('-').map(Number);
  return new Date(y, m - 1, d, Number(pv.hour), Number(pv.minute));
}

export default function FeedingForm({ initialData, onSubmit, onClose }) {
  const [feedingType, setFeedingType] = useState(initialData?.data?.feedingType || 'formula');
  const [amountMl, setAmountMl] = useState(initialData?.data?.amountMl || 150);
  const [startTime, setStartTime] = useState(() => {
    if (initialData?.data?.startTime) return new Date(initialData.data.startTime);
    return new Date();
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialData?.data?.endTime) return new Date(initialData.data.endTime);
    return null;
  });
  const [saving, setSaving] = useState(false);
  const [lastTimeAgo, setLastTimeAgo] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);

  const isEdit = !!initialData;

  useEffect(() => {
    recordsAPI.getByDate(getToday()).then(res => {
      if (res.success) {
        const lastFeeding = res.data.find(r => r.type === 'feeding');
        if (lastFeeding) {
          const agoMin = Math.floor((Date.now() - lastFeeding.timestamp) / 60000);
          setLastTimeAgo(formatDuration(agoMin));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountMl || amountMl <= 0) return;
    setSaving(true);
    await onSubmit({
      type: 'feeding',
      timestamp: startTime.getTime(),
      data: {
        feedingType,
        amountMl: Number(amountMl),
        startTime: startTime.getTime(),
        ...(endTime && { endTime: endTime.getTime() }),
      },
    });
    setSaving(false);
  };

  const durationText = (endTime && endTime > startTime)
    ? formatDuration(Math.round((endTime - startTime) / 60000))
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
        <div className="w-full max-w-md bg-white rounded-t-2xl shadow-modal animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <div>
              <h2 className="text-h3 text-text-primary">{isEdit ? '编辑喂养' : '添加喂养'}</h2>
              {lastTimeAgo && <p className="text-xs text-text-muted mt-0.5">上次：{lastTimeAgo}前</p>}
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">类型</label>
              <div className="flex gap-2">
                {FEEDING_TYPES.map((ft) => (
                  <button key={ft.value} type="button" onClick={() => setFeedingType(ft.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      feedingType === ft.value ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-primary border-border-light hover:border-brand-primary'
                    }`}>{ft.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">奶量（ml）</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {AMOUNT_PRESETS.map((preset) => (
                  <button key={preset} type="button" onClick={() => setAmountMl(preset)}
                    className={`btn-preset ${amountMl === preset ? 'btn-preset-active' : ''}`}>{preset}ml</button>
                ))}
              </div>
              <input type="number" className="input-field" placeholder="输入奶量（ml）" value={amountMl}
                onChange={e => setAmountMl(Number(e.target.value))} min={1} max={9999} />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">开始吃奶时间</label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('start')}>
                <span className="text-sm">{formatDisplay(startTime)}</span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                结束吃奶时间
                {durationText && <span className="text-brand-primary font-normal ml-2">（{durationText}）</span>}
              </label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('end')}>
                <span className={`text-sm ${endTime ? '' : 'text-text-muted'}`}>
                  {endTime ? formatDisplay(endTime) : '留空（可选）'}
                </span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 pb-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">取消</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pickerTarget && (
        <DateTimePicker
          title={pickerTarget === 'start' ? '开始时间' : '结束时间'}
          initialValue={pickerTarget === 'start' ? startTime : (endTime || startTime)}
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
