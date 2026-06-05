import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const bgMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Toast() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90vw] max-w-[360px]">
      {toasts.map((t) => {
        const Icon = iconMap[t.type] || iconMap.info;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-md animate-slide-down ${bgMap[t.type] || bgMap.info}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="flex-shrink-0">
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
