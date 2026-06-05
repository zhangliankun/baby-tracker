import { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { statisticsAPI } from '../services/api';
import { getToday } from '../utils/date';
import { ROLES, STATS_PERIODS } from '../utils/constants';
import FeedingStats from '../components/FeedingStats';
import SleepStats from '../components/SleepStats';
import DiaperStats from '../components/DiaperStats';
import SupplementStats from '../components/SupplementStats';
import SolidFoodStats from '../components/SolidFoodStats';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StatsPage() {
  const [period, setPeriod] = useState('week');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await statisticsAPI.get({
        period,
        date: getToday(),
        roleFilter,
      });
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '加载统计失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period, roleFilter]);

  return (
    <div className="px-4 pt-4">
      {/* 页面标题 */}
      <h1 className="text-h1 text-text-primary mb-4">统计分析</h1>

      {/* 周期切换 */}
      <div className="flex gap-2 mb-3">
        {STATS_PERIODS.map((sp) => (
          <button
            key={sp.value}
            onClick={() => setPeriod(sp.value)}
            className={`py-2 px-6 rounded-full text-sm font-medium transition-all ${
              period === sp.value
                ? 'bg-brand-primary text-white'
                : 'bg-white text-text-secondary border border-border-light'
            }`}
          >
            {sp.label}
          </button>
        ))}
      </div>

      {/* 角色筛选 */}
      <div className="mb-4">
        <select
          className="input-field text-sm py-2"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">全部角色</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* 统计内容 */}
      {loading ? (
        <LoadingSpinner text="加载统计..." />
      ) : stats ? (
        <div className="space-y-6">
          <FeedingStats data={stats.feeding} />
          <SleepStats data={stats.sleep} />
          <DiaperStats data={stats.diaper} />
          <SupplementStats data={stats.supplement} />
          <SolidFoodStats data={stats['solid-food']} />
        </div>
      ) : (
        <p className="text-center text-sm text-text-secondary py-8">
          暂无统计数据，请先添加记录
        </p>
      )}
    </div>
  );
}
