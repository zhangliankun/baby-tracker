import { Pill } from 'lucide-react';
import StatCard from './StatCard';

export default function SupplementStats({ data }) {
  if (!data || data.totalCount === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-h3 text-text-primary flex items-center gap-2">
          <Pill className="w-5 h-5 text-type-supplement" />
          补剂统计
        </h3>
        <p className="text-center text-sm text-text-secondary py-4">暂无补剂数据</p>
      </div>
    );
  }

  const entries = Object.entries(data.byName || {});

  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary flex items-center gap-2">
        <Pill className="w-5 h-5 text-type-supplement" />
        补剂统计
      </h3>

      <StatCard
        label="补剂总次数"
        value={data.totalCount}
        unit="次"
        color="#4ECDC4"
      />

      {entries.length > 0 && (
        <div className="card space-y-2">
          <p className="text-xs text-text-secondary">按名称统计</p>
          {entries.map(([name, count]) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-text-primary">{name}</span>
              <span className="text-sm font-semibold text-type-supplement">{count}次</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
