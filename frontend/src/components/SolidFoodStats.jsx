import { Apple, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';

export default function SolidFoodStats({ data }) {
  if (!data || data.totalCount === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-h3 text-text-primary flex items-center gap-2">
          <Apple className="w-5 h-5" style={{ color: '#FF8C42' }} />
          辅食统计
        </h3>
        <p className="text-center text-sm text-text-secondary py-4">暂无辅食数据</p>
      </div>
    );
  }

  const foodEntries = Object.entries(data.byName || {}).sort((a, b) => b[1] - a[1]);
  const allergyFoodEntries = Object.entries(data.allergyFoods || {}).sort((a, b) => b[1] - a[1]);
  const symptomEntries = Object.entries(data.allergySymptoms || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary flex items-center gap-2">
        <Apple className="w-5 h-5" style={{ color: '#FF8C42' }} />
        辅食统计
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="总次数" value={data.totalCount} unit="次" color="#FF8C42" />
        <StatCard label="种类数" value={data.varietyCount} unit="种" color="#FFB347" />
        <StatCard label="日均次数" value={data.avgDailyCount || 0} unit="次/天" color="#FF9A8B" />
      </div>

      {foodEntries.length > 0 && (
        <div className="card space-y-1.5">
          <p className="text-xs text-text-secondary mb-1">按食物名称</p>
          {foodEntries.map(([name, count]) => (
            <div key={name} className="flex items-center justify-between py-1">
              <span className="text-sm text-text-primary">{name}</span>
              <span className="text-sm font-semibold" style={{ color: '#FF8C42' }}>{count}次</span>
            </div>
          ))}
        </div>
      )}

      {/* 过敏统计 */}
      {data.allergyCount > 0 && (
        <>
          <div className="card">
            <p className="text-xs text-text-secondary mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              过敏统计
            </p>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-text-primary">过敏次数</span>
              <span className="text-sm font-semibold text-orange-500">{data.allergyCount}次</span>
            </div>
          </div>

          {allergyFoodEntries.length > 0 && (
            <div className="card space-y-1.5">
              <p className="text-xs text-text-secondary mb-1">过敏食物排行</p>
              {allergyFoodEntries.slice(0, 10).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-text-primary">⚠ {name}</span>
                  <span className="text-xs font-semibold text-orange-500">{count}次</span>
                </div>
              ))}
            </div>
          )}

          {symptomEntries.length > 0 && (
            <div className="card space-y-1.5">
              <p className="text-xs text-text-secondary mb-1">过敏症状分布</p>
              {symptomEntries.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-0.5">
                  <span className="text-sm text-text-primary">{name}</span>
                  <span className="text-xs font-semibold text-red-500">{count}次</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
