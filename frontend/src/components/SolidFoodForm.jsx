import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { recordsAPI } from '../services/api';
import { formatDuration } from '../utils/format';
import { getToday } from '../utils/date';
import { FOOD_NAMES, AMOUNT_G_PRESETS, ALLERGY_FOODS, ALLERGY_SYMPTOMS } from '../utils/constants';
import DateTimePicker from './DateTimePicker';

function formatDisplay(date) {
  return format(date, 'M月d日 HH:mm', { locale: zhCN });
}

export default function SolidFoodForm({ initialData, onSubmit, onClose }) {
  const [foodName, setFoodName] = useState(initialData?.data?.foodName || '');
  const [amountG, setAmountG] = useState(initialData?.data?.amountG || 15);
  const [startTime, setStartTime] = useState(() => {
    if (initialData?.data?.startTime) return new Date(initialData.data.startTime);
    return new Date();
  });
  const [endTime, setEndTime] = useState(() => {
    if (initialData?.data?.endTime) return new Date(initialData.data.endTime);
    return null;
  });
  const [remark, setRemark] = useState(initialData?.data?.remark || '');
  const [saving, setSaving] = useState(false);
  const [lastTimeAgo, setLastTimeAgo] = useState(null);
  const [pickerTarget, setPickerTarget] = useState(null);

  // 过敏
  const [allergyOpen, setAllergyOpen] = useState(() => {
    return !!(initialData?.data?.allergy?.foods?.length);
  });
  const [allergyFoods, setAllergyFoods] = useState(initialData?.data?.allergy?.foods || []);
  const [allergySymptoms, setAllergySymptoms] = useState(initialData?.data?.allergy?.symptoms || []);
  const [allergyNote, setAllergyNote] = useState(initialData?.data?.allergy?.note || '');
  const [customAllergyInput, setCustomAllergyInput] = useState('');

  const isEdit = !!initialData;

  useEffect(() => {
    const date = getToday();
    if (isEdit) return;
    recordsAPI.getByDate(date).then(res => {
      if (res.success) {
        const last = res.data.find(r => r.type === 'solid-food');
        if (last) {
          const agoMin = Math.floor((Date.now() - last.timestamp) / 60000);
          setLastTimeAgo(formatDuration(agoMin));
        }
      }
    }).catch(() => {});
  }, []);

  const toggleAllergyFood = (food) => {
    setAllergyFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food]);
  };
  const toggleAllergySymptom = (symptom) => {
    setAllergySymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };
  const addCustomAllergy = () => {
    const name = customAllergyInput.trim();
    if (name && !allergyFoods.includes(name)) {
      setAllergyFoods(prev => [...prev, name]);
    }
    setCustomAllergyInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    if (!amountG || amountG <= 0) return;
    setSaving(true);
    await onSubmit({
      type: 'solid-food',
      timestamp: startTime.getTime(),
      data: {
        foodName: foodName.trim(),
        amountG: Number(amountG),
        startTime: startTime.getTime(),
        ...(endTime && { endTime: endTime.getTime() }),
        ...(remark.trim() && { remark: remark.trim() }),
        ...(allergyFoods.length > 0 && {
          allergy: {
            foods: allergyFoods,
            ...(allergySymptoms.length > 0 && { symptoms: allergySymptoms }),
            ...(allergyNote.trim() && { note: allergyNote.trim() }),
          },
        }),
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
              <h2 className="text-h3 text-text-primary">{isEdit ? '编辑辅食' : '添加辅食'}</h2>
              {lastTimeAgo && <p className="text-xs text-text-muted mt-0.5">上次：{lastTimeAgo}前</p>}
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 食物名称 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">食物名称</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {FOOD_NAMES.map(name => (
                  <button key={name} type="button" onClick={() => setFoodName(name)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      foodName === name
                        ? 'bg-brand-primary text-white'
                        : 'bg-brand-secondary-light text-brand-primary hover:bg-brand-primary hover:text-white'
                    }`}>{name}</button>
                ))}
              </div>
              <input type="text" className="input-field" placeholder="或自由输入食物名称" value={foodName}
                onChange={e => setFoodName(e.target.value)} />
            </div>

            {/* 份量 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">份量（g）</label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {AMOUNT_G_PRESETS.map(preset => (
                  <button key={preset} type="button" onClick={() => setAmountG(preset)}
                    className={`btn-preset ${amountG === preset ? 'btn-preset-active' : ''}`}>{preset}g</button>
                ))}
              </div>
              <input type="number" className="input-field" placeholder="输入份量（g）" value={amountG}
                onChange={e => setAmountG(Number(e.target.value))} min={1} max={9999} />
            </div>

            {/* 开始时间 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">开始时间</label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('start')}>
                <span className="text-sm">{formatDisplay(startTime)}</span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            {/* 结束时间 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                结束时间
                {durationText && <span className="text-brand-primary font-normal ml-2">（{durationText}）</span>}
              </label>
              <div className="input-field cursor-pointer flex items-center justify-between" onClick={() => setPickerTarget('end')}>
                <span className={`text-sm ${endTime ? '' : 'text-text-muted'}`}>
                  {endTime ? formatDisplay(endTime) : '留空（可选）'}
                </span>
                <span className="text-xs text-text-muted">选择 ▸</span>
              </div>
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">备注（可选）</label>
              <textarea className="input-field" placeholder="如：第一次尝试，宝宝很喜欢" rows={2} value={remark}
                onChange={e => setRemark(e.target.value)} />
            </div>

            {/* 过敏记录（折叠区域） */}
            <div className="border border-border-light rounded-lg overflow-hidden">
              <button type="button"
                onClick={() => setAllergyOpen(!allergyOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-bg-page hover:bg-brand-secondary-light transition-colors">
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  宝宝过敏
                  {allergyFoods.length > 0 && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      {allergyFoods.length}项
                    </span>
                  )}
                </span>
                {allergyOpen ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
              </button>

              {allergyOpen && (
                <div className="px-4 py-3 space-y-3 animate-slide-down">
                  {/* 过敏食物 */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">过敏食物</label>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {ALLERGY_FOODS.map(food => (
                        <button key={food} type="button" onClick={() => toggleAllergyFood(food)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            allergyFoods.includes(food)
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-text-secondary border-border-light hover:border-orange-400'
                          }`}>{food}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" className="input-field text-xs py-1.5 flex-1" placeholder="自定义过敏食物"
                        value={customAllergyInput} onChange={e => setCustomAllergyInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(); } }} />
                      <button type="button" onClick={addCustomAllergy}
                        className="px-3 py-1.5 rounded-lg border border-border-light text-xs text-text-secondary hover:text-brand-primary hover:border-brand-primary transition-colors">添加</button>
                    </div>
                  </div>

                  {/* 过敏症状 */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">过敏症状</label>
                    <div className="flex gap-2">
                      {ALLERGY_SYMPTOMS.map(symptom => (
                        <button key={symptom} type="button" onClick={() => toggleAllergySymptom(symptom)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            allergySymptoms.includes(symptom)
                              ? 'bg-red-500 text-white border-red-500'
                              : 'bg-white text-text-secondary border-border-light hover:border-red-400'
                          }`}>{symptom}</button>
                      ))}
                    </div>
                  </div>

                  {/* 过敏备注 */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">过敏备注</label>
                    <textarea className="input-field text-xs" placeholder="描述过敏反应详情..." rows={2}
                      value={allergyNote} onChange={e => setAllergyNote(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            {/* 按钮 */}
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
            const [y, m, d] = pv.date.split('-').map(Number);
            const date = new Date(y, m - 1, d, Number(pv.hour), Number(pv.minute));
            if (pickerTarget === 'start') setStartTime(date);
            else setEndTime(date);
            setPickerTarget(null);
          }}
          onCancel={() => setPickerTarget(null)}
        />
      )}
    </>
  );
}
