import { useState, useEffect, useCallback } from 'react';
import { useBaby } from '../contexts/BabyContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { recordsAPI, sleepTimerAPI } from '../services/api';
import { formatAge, getToday, parseISO, isToday, isYesterday } from '../utils/date';
import DateSwitcher from '../components/DateSwitcher';
import RecordItem from '../components/RecordItem';
import EmptyState from '../components/EmptyState';
import FloatingAddBtn from '../components/FloatingAddBtn';
import FeedingForm from '../components/FeedingForm';
import SleepForm from '../components/SleepForm';
import DiaperForm from '../components/DiaperForm';
import SupplementForm from '../components/SupplementForm';
import SolidFoodForm from '../components/SolidFoodForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { Clock } from 'lucide-react';

export default function TimelinePage() {
  const { baby, fetchBaby, loading: babyLoading } = useBaby();
  const { user, baby: authBaby } = useAuth();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [runningTimer, setRunningTimer] = useState(null); // 运行中的计时器

  // 表单状态
  const [formType, setFormType] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [timerStopData, setTimerStopData] = useState(null); // 醒来后的预填数据

  const currentBaby = baby || authBaby;
  const ageText = currentBaby?.birthDate ? formatAge(currentBaby.birthDate) : '';

  // 初始化
  useEffect(() => {
    if (!baby && !babyLoading && !authBaby) {
      fetchBaby();
    } else if (!baby && authBaby) {
      fetchBaby();
    }
  }, []);

  // 加载记录 + 检查计时器
  const loadRecords = useCallback(async (date) => {
    setRecordsLoading(true);
    try {
      const [recordsRes, timerRes] = await Promise.all([
        recordsAPI.getByDate(date),
        sleepTimerAPI.status(),
      ]);
      if (recordsRes.success) setRecords(recordsRes.data);
      if (timerRes.success && timerRes.data) {
        setRunningTimer(timerRes.data);
      } else {
        setRunningTimer(null);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '加载记录失败');
    } finally {
      setRecordsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRecords(selectedDate);
  }, [selectedDate, loadRecords]);

  // 构建融合了计时器的记录列表
  const buildDisplayRecords = useCallback(() => {
    const display = [...records];
    // 如果今天的视图且有 runningTimer，插入虚拟记录
    if (runningTimer && selectedDate === getToday()) {
      const timerRecord = {
        id: '__timer__',
        type: 'sleep',
        timestamp: runningTimer.startTime,
        userRole: '',
        userId: runningTimer.userId,
        data: { startTime: runningTimer.startTime },
        isTimerCard: true,
        timerId: runningTimer.id,
      };
      display.unshift(timerRecord);
    }
    return display;
  }, [records, runningTimer, selectedDate]);

  const displayRecords = buildDisplayRecords();

  // 分组
  const grouped = displayRecords.reduce((acc, r) => {
    const dateStr = new Date(r.timestamp).toISOString().split('T')[0];
    if (isToday(parseISO(dateStr))) acc.today.push(r);
    else if (isYesterday(parseISO(dateStr))) acc.yesterday.push(r);
    else acc.older.push(r);
    return acc;
  }, { today: [], yesterday: [], older: [] });

  // === 添加记录 ===
  const handleAdd = useCallback(async (recordData) => {
    try {
      const res = await recordsAPI.create(recordData);
      if (res.success) {
        toast.success('记录已添加');
        setFormType(null);
        setEditingRecord(null);
        loadRecords(selectedDate);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '添加失败');
    }
  }, [selectedDate, loadRecords, toast]);

  // === 编辑记录 ===
  const handleEdit = useCallback((record) => {
    setEditingRecord(record);
    setFormType(record.type);
    setTimerStopData(null);
  }, []);

  const handleUpdate = useCallback(async (recordData) => {
    try {
      const res = await recordsAPI.update(editingRecord.id, recordData);
      if (res.success) {
        toast.success('记录已更新');
        setFormType(null);
        setEditingRecord(null);
        loadRecords(selectedDate);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '更新失败');
    }
  }, [editingRecord, selectedDate, loadRecords, toast]);

  // === 删除记录 ===
  const handleDelete = useCallback(async (record) => {
    if (record.isTimerCard) return; // 临时卡片不能删除
    if (!window.confirm('确定要删除这条记录吗？')) return;
    try {
      const res = await recordsAPI.delete(record.id);
      if (res.success) {
        toast.success('记录已删除');
        loadRecords(selectedDate);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '删除失败');
    }
  }, [selectedDate, loadRecords, toast]);

  // === 睡眠计时 ===

  // 计时开始 → 回列表
  const handleTimerStarted = useCallback(() => {
    toast.success('计时已开始');
    setFormType(null);
    setEditingRecord(null);
    loadRecords(selectedDate);
  }, [selectedDate, loadRecords, toast]);

  // 点击临时卡片 → 打开睡眠弹窗（显示计时器面板）
  const handleTimerCardClick = useCallback(() => {
    setEditingRecord(null);
    setTimerStopData(null);
    setFormType('sleep');
  }, []);

  // 点"宝宝醒了" → 停止计时 → 打开弹窗并预填数据
  const handleWakeUp = useCallback(async () => {
    try {
      const res = await sleepTimerAPI.stop();
      if (res.success) {
        setRunningTimer(null);
        setTimerStopData({
          startTime: res.data.startTime,
          endTime: res.data.endTime,
          durationMinutes: res.data.durationMinutes,
        });
        setEditingRecord(null);
        setFormType('sleep');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '停止计时失败');
    }
  }, [toast]);

  // 计时保存（醒来后确认保存）
  const handleTimerSaved = useCallback(async (recordData) => {
    try {
      const res = await recordsAPI.create(recordData);
      if (res.success) {
        toast.success('睡眠记录已保存');
        setFormType(null);
        setEditingRecord(null);
        setTimerStopData(null);
        loadRecords(selectedDate);
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '保存失败');
    }
  }, [selectedDate, loadRecords, toast]);

  const handleCloseForm = () => {
    setFormType(null);
    setEditingRecord(null);
    setTimerStopData(null);
  };

  // === 渲染表单 ===
  const renderForm = () => {
    const commonProps = { onClose: handleCloseForm };
    switch (formType) {
      case 'feeding':
        return <FeedingForm {...commonProps} initialData={editingRecord} onSubmit={editingRecord ? handleUpdate : handleAdd} />;
      case 'sleep':
        return (
          <SleepForm
            {...commonProps}
            initialData={editingRecord}
            timerStopData={timerStopData}
            onSubmit={editingRecord ? handleUpdate : undefined}
            onStartTimer={handleTimerStarted}
            onTimerSaved={handleTimerSaved}
            onWakeUpData={timerStopData}
          />
        );
      case 'diaper':
        return <DiaperForm {...commonProps} initialData={editingRecord} onSubmit={editingRecord ? handleUpdate : handleAdd} />;
      case 'supplement':
        return <SupplementForm {...commonProps} initialData={editingRecord} onSubmit={editingRecord ? handleUpdate : handleAdd} />;
      case 'solid-food':
        return <SolidFoodForm {...commonProps} initialData={editingRecord} onSubmit={editingRecord ? handleUpdate : handleAdd} />;
      default:
        return null;
    }
  };

  return (
    <div className="px-4 pt-4">
      {/* 顶部：宝宝信息 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-text-primary">{currentBaby?.nickname || '我的宝宝'}</h1>
            {ageText && <p className="text-sm text-brand-primary font-medium mt-1">{ageText}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">{user?.role || ''}</p>
          </div>
        </div>
      </div>

      <DateSwitcher selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {recordsLoading ? (
        <LoadingSpinner text="加载记录..." />
      ) : displayRecords.length === 0 ? (
        <EmptyState icon={Clock} title="暂无记录" description="点击右下角 + 按钮添加第一条记录" />
      ) : (
        <div className="space-y-4">
          {grouped.today.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2 px-1">今天</h3>
              {grouped.today.map((r) => (
                <RecordItem
                  key={r.id}
                  record={r}
                  onEdit={r.isTimerCard ? handleTimerCardClick : handleEdit}
                  onDelete={handleDelete}
                  onWakeUp={r.isTimerCard ? handleWakeUp : undefined}
                />
              ))}
            </div>
          )}
          {grouped.yesterday.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2 px-1">昨天</h3>
              {grouped.yesterday.map((r) => (
                <RecordItem key={r.id} record={r} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
          {grouped.older.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-secondary mb-2 px-1">更早</h3>
              {grouped.older.map((r) => (
                <RecordItem key={r.id} record={r} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      )}

      <FloatingAddBtn onSelect={setFormType} />
      {formType && renderForm()}
    </div>
  );
}
