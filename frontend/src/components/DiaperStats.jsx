import { StickyNote } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatCard from './StatCard';

const POOP_COLOR_MAP = {
  yellow: '#F0C040',
  'yellow-green': '#A0C040',
  'dark-green': '#2E6B3E',
  'green-brown': '#6B5E2E',
  'pale-yellow': '#F5E6A0',
  'dark-brown': '#5C3A1E',
};
const POOP_COLOR_LABELS = {
  yellow: '黄色', 'yellow-green': '黄绿色', 'dark-green': '墨绿色',
  'green-brown': '绿褐色', 'pale-yellow': '淡黄色', 'dark-brown': '暗褐色',
};
const POOP_SHAPE_LABELS = {
  paste: '糊状', 'dry-thick': '干稠', 'cream-like': '膏状',
  'milk-curd': '奶瓣', watery: '稀水样', foamy: '泡沫状',
};

export default function DiaperStats({ data }) {
  if (!data) {
    return <p className="text-center text-sm text-text-secondary py-4">暂无尿布数据</p>;
  }

  const poopColorData = Object.entries(data.poopColorDistribution || {}).map(([k, v]) => ({
    name: POOP_COLOR_LABELS[k] || k,
    value: v,
    color: POOP_COLOR_MAP[k] || '#CCC',
  }));

  const poopShapeData = Object.entries(data.poopShapeDistribution || {}).map(([k, v]) => ({
    name: POOP_SHAPE_LABELS[k] || k,
    value: v,
  }));

  const SHAPE_COLORS = ['#FFB347', '#FFCC80', '#FFE0B2', '#FFD54F', '#FFC107', '#FF9800'];

  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary flex items-center gap-2">
        <StickyNote className="w-5 h-5 text-type-diaper" />
        尿布统计
      </h3>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="总次数" value={data.totalCount || 0} unit="次" color="#FFB347" />
        <StatCard label="嘘嘘" value={data.peeCount || 0} unit="次" color="#5AC8FA" />
        <StatCard label="臭臭" value={data.poopCount || 0} unit="次" color="#FF9500" />
      </div>

      {poopColorData.length > 0 && (
        <div className="card">
          <p className="text-xs text-text-secondary mb-2">臭臭颜色分布</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={poopColorData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#CCC', strokeWidth: 1 }}
              >
                {poopColorData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {poopShapeData.length > 0 && (
        <div className="card">
          <p className="text-xs text-text-secondary mb-2">臭臭形状分布</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={poopShapeData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#CCC', strokeWidth: 1 }}
              >
                {poopShapeData.map((_, i) => (
                  <Cell key={i} fill={SHAPE_COLORS[i % SHAPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.redButtCount > 0 && (
        <p className="text-xs text-red-400 px-1">
          红屁屁发生 {data.redButtCount} 次
        </p>
      )}
    </div>
  );
}
