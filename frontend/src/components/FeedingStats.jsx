import { Milk } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatCard from './StatCard';

const COLORS = ['#FF9A8B', '#FFD6A5', '#FFB5A7'];
const LABELS = { formula: '配方奶', breast: '母乳', bottle_breast: '瓶喂母乳' };

export default function FeedingStats({ data }) {
  if (!data) {
    return <p className="text-center text-sm text-text-secondary py-4">暂无喂养数据</p>;
  }

  const pieData = Object.entries(data.byType || {})
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: LABELS[key] || key, value }));

  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary flex items-center gap-2">
        <Milk className="w-5 h-5 text-type-feeding" />
        喂养统计
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="总奶量"
          value={data.totalMl || 0}
          unit="ml"
          color="#FF9A8B"
        />
        <StatCard
          label="日均奶量"
          value={data.avgDailyMl || 0}
          unit="ml/天"
          color="#FFB5A7"
        />
      </div>

      {pieData.length > 0 && (
        <div className="card">
          <p className="text-xs text-text-secondary mb-2">喂养类型占比</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => `${val}ml`} />
              <Legend
                formatter={(val) => <span className="text-xs text-text-secondary">{val}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
