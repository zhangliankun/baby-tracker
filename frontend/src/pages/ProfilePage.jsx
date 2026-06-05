import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { babyAPI, recordsAPI, exportAPI } from '../services/api';
import { ROLES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';
import { Copy, Download, Trash2, LogOut, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, baby, inviteCode, logout, setBaby } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState(baby?.nickname || '');
  const [birthDate, setBirthDate] = useState(baby?.birthDate || '');
  const [role, setRole] = useState(user?.role || '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSaveBaby = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }
    setSaving(true);
    try {
      const res = await babyAPI.update({ nickname: nickname.trim(), birthDate });
      if (res.success) {
        setBaby(res.data);
        toast.success('宝宝信息已更新');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode).then(() => {
        setCopied(true);
        toast.success('邀请码已复制');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('复制失败，请手动复制');
      });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportAPI.get();
      if (res.success) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `baby-records-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('数据已导出');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ 此操作将删除所有记录，无法恢复！\n\n确定要继续吗？')) return;
    if (!window.confirm('再次确认：清空后数据无法找回。确定清空吗？')) return;
    try {
      await recordsAPI.deleteAll(true);
      toast.success('所有记录已清空');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '清空失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="px-4 pt-4">
      <h1 className="text-h1 text-text-primary mb-4">我的</h1>

      {/* 宝宝信息 */}
      <section className="card mb-3">
        <h2 className="text-h3 text-text-primary mb-3">宝宝信息</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">昵称</label>
            <input
              type="text"
              className="input-field"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">出生日期</label>
            <input
              type="date"
              className="input-field"
              value={birthDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleSaveBaby}
            disabled={saving}
            className="btn-primary w-full py-2.5 text-sm"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </section>

      {/* 账号信息 */}
      <section className="card mb-3">
        <h2 className="text-h3 text-text-primary mb-3">账号信息</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">用户名</span>
            <span className="text-sm text-text-primary font-medium">{user?.username}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">当前角色</span>
            <span className="text-sm text-brand-primary font-medium">{user?.role}</span>
          </div>
        </div>
      </section>

      {/* 邀请码 */}
      {inviteCode && (
        <section className="card mb-3">
          <h2 className="text-h3 text-text-primary mb-2">家庭邀请码</h2>
          <p className="text-xs text-text-secondary mb-2">将此邀请码分享给家人，让他们加入一起记录</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg-page rounded-lg px-4 py-3 text-center">
              <span className="text-2xl font-bold tracking-[0.3em] text-brand-primary">
                {inviteCode}
              </span>
            </div>
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-1.5 px-4 py-3 rounded-lg border border-brand-primary text-brand-primary text-sm font-medium
                         active:bg-brand-secondary-light transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </section>
      )}

      {/* 数据管理 */}
      <section className="card mb-3">
        <h2 className="text-h3 text-text-primary mb-3">数据管理</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-bg-page hover:bg-brand-secondary-light transition-colors"
          >
            <Download className="w-5 h-5 text-brand-primary" />
            <span className="text-sm text-text-primary">{exporting ? '导出中...' : '导出数据 (JSON)'}</span>
          </button>
          <button
            onClick={handleClearData}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-bg-page hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-500">清空所有记录</span>
          </button>
        </div>
      </section>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-red-200 text-red-500 text-sm font-medium
                   hover:bg-red-50 active:bg-red-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>

      <div className="h-8" />
    </div>
  );
}
