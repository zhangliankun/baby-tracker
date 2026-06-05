import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { POOP_COLORS, POOP_SHAPES } from '../utils/constants';
import { recordsAPI } from '../services/api';
import { formatDuration } from '../utils/format';
import { getToday } from '../utils/date';
import DateTimePicker from './DateTimePicker';

const DIAPER_TYPES = [
  { key: 'pee_only', label: '仅嘘嘘' },
  { key: 'poop_only', label: '仅臭臭' },
  { key: 'both', label: '嘘嘘+臭臭' },
];

function formatDisplay(date) {
  return format(date, 'M月d日 HH:mm', { locale: zhCN });
}

export default function DiaperForm({ initialData, onSubmit, onClose }) {
  const getInitialType = () => {
    if (!initialData?.data) return 'pee_only';
    const d = initialData.data;
    if (d.pee && d.poop) return 'both';
    if (d.poop) return 'poop_only';
    return 'pee_only';
  };

  const [diaperType, setDiaperType] = useState(getInitialType());
  const [poopColor, setPoopColor] = useState(initialData?.data?.poopColor || 'yellow');
  const [poopShape, setPoopShape] = useState(initialData?.data?.poopShape || 'paste');
  const [redButt, setRedButt] = useState(initialData?.data?.redButt || false);
  const [timestamp, setTimestamp] = useState(() => {
    if (initialData?.timestamp) return new Date(initialData.timestamp);
    return new Date();
  });
  const [saving, setSaving] = useState(false);
  const [lastTimeAgo, setLastTimeAgo] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const isEdit = !!initialData;
  const showPoopFields = diaperType === 'poop_only' || diaperType === 'both';

  useEffect(() => {
    recordsAPI.getByDate(getToday()).then(res => {
      if (res.success) {
        const last = res.data.find(r => r.type === 'diaper');
        if (last) {
          const agoMin = Math.floor((Date.now() - last.timestamp) / 60000);
          setLastTimeAgo(formatDuration(agoMin));
        }
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      type: 'diaper',
      timestamp: timestamp.getTime(),
      data: {
        pee: diaperType === 'pee_only' || diaperType === 'both',
        poop: diaperType === 'poop_only' || diaperType === 'both',
        poopColor: showPoopFields ? poopColor : undefined,
        poopShape: showPoopFields ? poopShape : undefined,
        redButt,
      },
    });
    setSaving(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onClick={onClose}>
        <div className="w-full max-w-md bg-white rounded-t-2xl shadow-modal animate-slide-up" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
            <div>
              <h2 className="text-h3 text-text-primary">{isEdit ? '编辑尿布' : '添加尿布'}</h2>
              {lastTimeAgo && <p className="text-xs text-text-muted mt-0.5">上次：{lastTimeAgo}前</p>}
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 类型 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">类型</label>
              <div className="flex gap-2">
                {DIAPER_TYPES.map(dt => (
                  <button key={dt.key} type="button" onClick={() => setDiaperType(dt.key)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      diaperType === dt.key ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-primary border-border-light hover:border-brand-primary'
                    }`}>{dt.label}</button>
                ))}
              </div>
            </div>

            {showPoopFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">臭臭颜色</label>
                  <div className="grid grid-cols-3 gap-2">
                    {POOP_COLORS.map(pc => (
                      <button key={pc.value} type="button" onClick={() => setPoopColor(pc.value)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm border transition-all ${
                          poopColor === pc.value ? 'border-brand-primary bg-brand-secondary-light' : 'border-border-light bg-white hover:border-brand-primary'
                        }`}>
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: pc.color }} />
                        <span className="text-xs truncate">{pc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">臭臭形状</label>
                  <div className="grid grid-cols-3 gap-2">
                    {POOP_SHAPES.map(ps => (
                      <button key={ps.value} type="button" onClick={() => setPoopShape(ps.value)}
                        className={`py-2 px-3 rounded-lg text-sm border transition-all ${
                          poopShape === ps.value ? 'border-brand-primary bg-brand-secondary-light text-brand-primary' : 'border-border-light bg-white text-text-primary hover:border-brand-primary'
                        }`}>{ps.label}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">红屁屁</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setRedButt(false)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${!redButt ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-primary border-border-light'}`}>否</button>
                <button type="button" onClick={() => setRedButt(true)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${redButt ? 'bg-red-500 text-white border-red-500' : 'bg-white text-text-primary border-border-light'}`}>是 🍑</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">记录时间</label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setShowPicker(true)}>
                <span className="text-sm">{formatDisplay(timestamp)}</span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2 pb-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">取消</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">{saving ? '保存中...' : '保存'}</button>
            </div>
          </form>
        </div>
      </div>

      {showPicker && (
        <DateTimePicker
          title="记录时间"
          initialValue={timestamp}
          onConfirm={(date) => { setTimestamp(date); setShowPicker(false); }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
