import { useState } from 'react';
import { Plus, X, Milk, Moon, StickyNote, Pill, Apple } from 'lucide-react';

const actions = [
  { type: 'feeding', label: '喂养', Icon: Milk, color: '#FF9A8B' },
  { type: 'sleep', label: '睡眠', Icon: Moon, color: '#7B8CDE' },
  { type: 'diaper', label: '尿布', Icon: StickyNote, color: '#FFB347' },
  { type: 'supplement', label: '补剂', Icon: Pill, color: '#4ECDC4' },
  { type: 'solid-food', label: '辅食', Icon: Apple, color: '#FF8C42' },
];

export default function FloatingAddBtn({ onSelect }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (type) => {
    setOpen(false);
    onSelect(type);
  };

  return (
    <>
      {/* 遮罩层 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 动作菜单 */}
      {open && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-sm animate-slide-up">
          <div className="bg-white rounded-xl shadow-modal p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm font-medium text-text-primary">选择记录类型</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map(({ type, label, Icon, color }) => (
                <button
                  key={type}
                  onClick={() => handleSelect(type)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-page hover:bg-brand-secondary-light transition-colors active:scale-[0.98]"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: color + '18' }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 浮动按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-brand-primary text-white
                   shadow-fab flex items-center justify-center transition-all duration-200
                   active:scale-95 ${open ? 'rotate-45' : 'rotate-0'}`}
      >
        <Plus className="w-7 h-7" />
      </button>
    </>
  );
}
