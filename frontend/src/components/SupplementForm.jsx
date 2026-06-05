import { useState, useEffect } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { recordsAPI } from '../services/api';
import { formatDuration } from '../utils/format';
import { getToday } from '../utils/date';
import DateTimePicker from './DateTimePicker';

function formatDisplay(date) {
  return format(date, 'M月d日 HH:mm', { locale: zhCN });
}

const COMMON_SUPPLEMENTS = ['维生素AD', '维生素D3', '益生菌', '钙', '锌', '铁', 'DHA'];

const DOSE_UNITS = ['粒', '滴', '袋', '勺', '片', '支'];
const DOSE_UNITS2 = ['ml', 'mg', 'g', 'IU'];

function toDatetimeLocal(ts) {
  return new Date(ts);
}

// 用量输入弹层
function DoseInputModal({ initialDose, onConfirm, onCancel }) {
  // 解析已有剂量 e.g. "1粒" → value="1", unit="粒"
  const parseDose = (d) => {
    if (!d) return { value: '', unit: '粒' };
    const match = d.match(/^([\d.]+)\s*(.*)$/);
    if (match) return { value: match[1], unit: match[2] || '粒' };
    return { value: '', unit: '粒' };
  };
  const parsed = parseDose(initialDose);
  const [value, setValue] = useState(parsed.value);
  const [unit, setUnit] = useState(parsed.unit);

  const displayDose = value ? `${value} ${unit}` : `0 ${unit}`;

  const handleDigit = (d) => setValue(prev => prev + d);
  const handleBackspace = () => setValue(prev => prev.slice(0, -1));
  const handleDot = () => { if (!value.includes('.')) setValue(prev => prev + '.'); };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30" onClick={onCancel}>
      <div className="w-full max-w-md bg-white rounded-t-2xl shadow-modal animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
          <button onClick={onCancel} className="text-sm text-text-secondary">取消</button>
          <span className="text-sm font-medium text-text-primary">填写用量</span>
          <button onClick={() => onConfirm(value ? `${value} ${unit}` : `${unit}`)} className="text-sm font-medium text-brand-primary">确定</button>
        </div>

        {/* 用量显示 */}
        <div className="flex items-center justify-center py-4 bg-brand-secondary-light/50">
          <span className="text-h2 font-bold text-text-primary">用量</span>
          <span className="text-h1 font-bold text-brand-primary ml-3">{displayDose}</span>
        </div>

        {/* 单位选择 */}
        <div className="px-4 py-2 space-y-2">
          <div className="flex gap-2 flex-wrap">
            {DOSE_UNITS.map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  unit === u ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-primary border-border-light'
                }`}>{u}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {DOSE_UNITS2.map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  unit === u ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-text-primary border-border-light'
                }`}>{u}</button>
            ))}
          </div>
        </div>

        {/* 数字键盘 */}
        <div className="grid grid-cols-3 gap-1 px-4 pb-6 pt-2">
          {['7','8','9','4','5','6','1','2','3'].map(d => (
            <button key={d} onClick={() => handleDigit(d)}
              className="py-3 text-xl font-medium text-text-primary rounded-lg hover:bg-bg-page active:bg-brand-secondary-light transition-colors">{d}</button>
          ))}
          <button onClick={handleDot}
            className="py-3 text-xl font-medium text-text-primary rounded-lg hover:bg-bg-page active:bg-brand-secondary-light transition-colors">.</button>
          <button onClick={() => handleDigit('0')}
            className="py-3 text-xl font-medium text-text-primary rounded-lg hover:bg-bg-page active:bg-brand-secondary-light transition-colors">0</button>
          <button onClick={handleBackspace} className="py-3 text-lg font-medium text-text-secondary rounded-lg hover:bg-bg-page active:bg-brand-secondary-light transition-colors">⌫</button>
        </div>
      </div>
    </div>
  );
}

// 补剂卡片
function SupplementCard({ supp, index, onChange, onRemove, onDoseClick }) {
  return (
    <div className="flex items-center gap-2 bg-bg-page rounded-lg px-3 py-2.5">
      <input
        type="text"
        className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        placeholder="补剂名称"
        value={supp.name}
        onChange={(e) => onChange(index, 'name', e.target.value)}
      />
      <button
        onClick={() => onDoseClick(index)}
        className="flex items-center gap-1 px-2 py-1 rounded border border-border-light text-xs text-text-secondary hover:text-brand-primary hover:border-brand-primary transition-colors"
      >
        {supp.dose || '用量'}
        <Pencil className="w-3 h-3" />
      </button>
      <button onClick={() => onRemove(index)} className="p-1 text-text-muted hover:text-red-500 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SupplementForm({ initialData, onSubmit, onClose }) {
  // 初始化补剂列表
  const initSupps = () => {
    if (initialData?.data?.supplements) return [...initialData.data.supplements];
    if (initialData?.data?.name) return [{ name: initialData.data.name, dose: initialData.data.dose || '' }];
    return [{ name: '', dose: '' }];
  };

  const [supplements, setSupplements] = useState(initSupps());
  const [remark, setRemark] = useState(initialData?.data?.remark || '');
  const [timestamp, setTimestamp] = useState(() => {
    if (initialData?.timestamp) return new Date(initialData.timestamp);
    return new Date();
  });
  const [saving, setSaving] = useState(false);
  const [lastTimeAgo, setLastTimeAgo] = useState(null);
  const [recentAdds, setRecentAdds] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // 用量弹层
  const [dosingIndex, setDosingIndex] = useState(null);

  const isEdit = !!initialData;

  // 上次 + 最近添加
  useEffect(() => {
    recordsAPI.getByDate(getToday()).then(res => {
      if (res.success) {
        const last = res.data.find(r => r.type === 'supplement');
        if (last) {
          const agoMin = Math.floor((Date.now() - last.timestamp) / 60000);
          setLastTimeAgo(formatDuration(agoMin));
        }
        // 收集最近补剂名称
        const names = [];
        for (const r of res.data) {
          if (r.type === 'supplement') {
            if (r.data.supplements) {
              r.data.supplements.forEach(s => { if (s.name && !names.includes(s.name)) names.push(s.name); });
            } else if (r.data.name && !names.includes(r.data.name)) {
              names.push(r.data.name);
            }
          }
        }
        setRecentAdds(names.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  const addSupp = (name = '') => {
    setSupplements(prev => [...prev, { name, dose: '' }]);
  };
  const removeSupp = (i) => {
    if (supplements.length <= 1) return;
    setSupplements(prev => prev.filter((_, idx) => idx !== i));
  };
  const changeSupp = (i, key, val) => {
    setSupplements(prev => prev.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
  };
  const handleDoseConfirm = (dose) => {
    if (dosingIndex !== null) {
      changeSupp(dosingIndex, 'dose', dose);
    }
    setDosingIndex(null);
  };

  const quickAdd = (name) => {
    // 如果第一个是空的就填充第一个
    const emptyIdx = supplements.findIndex(s => !s.name.trim());
    if (emptyIdx >= 0) {
      changeSupp(emptyIdx, 'name', name);
    } else {
      addSupp(name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valid = supplements.filter(s => s.name.trim());
    if (valid.length === 0) return;
    setSaving(true);
    await onSubmit({
      type: 'supplement',
      timestamp: timestamp.getTime(),
      data: {
        supplements: valid.map(s => ({ name: s.name.trim(), dose: s.dose.trim() || '1粒' })),
        ...(remark.trim() && { remark: remark.trim() }),
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
              <h2 className="text-h3 text-text-primary">{isEdit ? '编辑补剂' : '营养补剂'}</h2>
              {lastTimeAgo && <p className="text-xs text-text-muted mt-0.5">上次：{lastTimeAgo}前</p>}
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 开始时间 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">开始时间</label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setShowPicker(true)}>
                <span className="text-sm">{formatDisplay(timestamp)}</span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            {/* 补剂列表 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-text-primary">补剂列表</label>
              </div>
              <div className="space-y-2">
                {supplements.map((s, i) => (
                  <SupplementCard key={i} supp={s} index={i} onChange={changeSupp} onRemove={removeSupp} onDoseClick={setDosingIndex} />
                ))}
              </div>
              <button type="button" onClick={() => addSupp()}
                className="w-full mt-2 py-2.5 border-2 border-dashed border-border-light rounded-lg text-sm text-text-muted hover:text-brand-primary hover:border-brand-primary transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> 添加
              </button>
            </div>

            {/* 常见补剂快捷按钮 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">常见补剂</label>
              <div className="flex gap-2 flex-wrap">
                {COMMON_SUPPLEMENTS.map(name => (
                  <button key={name} type="button" onClick={() => quickAdd(name)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-secondary-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors">{name}</button>
                ))}
              </div>
            </div>

            {/* 最近添加 */}
            {recentAdds.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">最近添加</label>
                <div className="flex gap-2 flex-wrap">
                  {recentAdds.map(name => (
                    <button key={name} type="button" onClick={() => quickAdd(name)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-border-light text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors">{name}</button>
                  ))}
                </div>
              </div>
            )}

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">备注（可选）</label>
              <textarea className="input-field" placeholder="备注" rows={2} value={remark} onChange={e => setRemark(e.target.value)} />
            </div>

            {/* 按钮 */}
            <div className="flex gap-3 pt-2 pb-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">取消</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5">{saving ? '保存中...' : '保存'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* 用量输入弹层 */}
      {dosingIndex !== null && (
        <DoseInputModal
          initialDose={supplements[dosingIndex]?.dose || ''}
          onConfirm={handleDoseConfirm}
          onCancel={() => setDosingIndex(null)}
        />
      )}

      {showPicker && (
        <DateTimePicker
          title="开始时间"
          initialValue={timestamp}
          onConfirm={(v) => {
            const [y, m, d] = v.date.split('-').map(Number);
            const h = Number(v.hour);
            const min = Number(v.minute);
            setTimestamp(new Date(y, m - 1, d, h, min));
            setShowPicker(false);
          }}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
