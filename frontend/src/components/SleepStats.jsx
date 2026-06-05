import { Moon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';

export default function SleepStats({ data }) {
  if (!data) {
    return <p className="text-center text-sm text-text-secondary py-4">暂无睡眠数据</p>;
  }

  const chartData = (data.dailyBreakdown || []).map((d) => ({
    ...d,
    hours: Math.round(d.minutes / 6) / 10,
    label: d.date.slice(5),
  }));

  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary flex items-center gap-2">
        <Moon className="w-5 h-5 text-type-sleep" />
        睡眠统计
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="总时长"
          value={Math.round(data.totalMinutes / 6) / 10}
          unit="小时"
          color="#7B8CDE"
        />
        <StatCard
          label="日均时长"
          value={Math.round(data.avgDailyMinutes / 6) / 10}
          unit="小时/天"
          color="#A0ADF0"
        />
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <p className="text-xs text-text-secondary mb-2">每日睡眠时长（小时）</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8E8E93' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8E8E93' }} />
              <Tooltip formatter={(val) => `${val}小时`} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#7B8CDE"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#7B8CDE' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
