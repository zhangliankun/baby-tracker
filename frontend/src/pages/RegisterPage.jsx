import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Baby, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../services/api';
import { ROLES } from '../utils/constants';
import LoadingSpinner from '../components/LoadingSpinner';

export default function RegisterPage() {
  const [mode, setMode] = useState(null); // null=选择模式, 'create'=创建家庭, 'join'=加入家庭
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('妈妈');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();

  const validate = () => {
    if (!username.trim() || username.trim().length < 2) {
      toast.error('用户名为 2-20 个字符');
      return false;
    }
    if (!password || password.length < 6) {
      toast.error('密码至少 6 个字符');
      return false;
    }
    if (mode === 'create' && !familyName.trim()) {
      toast.error('请输入家庭名称');
      return false;
    }
    if (mode === 'join' && !inviteCode.trim()) {
      toast.error('请输入邀请码');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const body = {
        username: username.trim(),
        password,
        role,
      };
      if (mode === 'create') {
        body.familyName = familyName.trim();
      } else {
        body.inviteCode = inviteCode.trim().toUpperCase();
      }

      const res = await authAPI.register(body);
      if (res.success) {
        register(res.data);
        toast.success('注册成功！');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 步骤 0：选择创建或加入
  if (!mode) {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 rounded-full bg-brand-secondary-light flex items-center justify-center mb-4 shadow-sm">
            <Baby className="w-10 h-10 text-brand-primary" />
          </div>
          <h1 className="text-h1 text-text-primary mb-2">欢迎加入</h1>
          <p className="text-sm text-text-secondary mb-10 text-center">
            记录宝宝的每一次成长
          </p>

          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-4 rounded-xl bg-white shadow-card border-2 border-brand-primary text-brand-primary font-semibold text-lg
                         active:bg-brand-secondary-light transition-colors"
            >
              创建新家庭
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-4 rounded-xl bg-white shadow-card border-2 border-brand-secondary text-text-primary font-semibold text-lg
                         active:bg-brand-secondary-light transition-colors"
            >
              通过邀请码加入
            </button>
          </div>

          <p className="mt-8 text-sm text-text-secondary">
            已有账号？{' '}
            <Link to="/login" className="text-brand-primary font-medium hover:underline">
              去登录
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // 步骤 1：填写表单
  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* 顶部导航 */}
      <div className="px-4 py-3">
        <button
          onClick={() => setMode(null)}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
          返回
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6">
        <h1 className="text-h1 text-text-primary mb-1">
          {mode === 'create' ? '创建新家庭' : '加入家庭'}
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          {mode === 'create' ? '设置你的家庭和账号信息' : '输入邀请码和你的账号信息'}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          {/* 家庭名称 / 邀请码 */}
          {mode === 'create' ? (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                家庭名称
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="如：幸福小家"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                邀请码
              </label>
              <input
                type="text"
                className="input-field uppercase"
                placeholder="6位邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
              />
            </div>
          )}

          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              用户名
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="2-20个字符"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoComplete="username"
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              密码
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* 角色选择 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              我是
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                    role === r
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-white text-text-primary border-border-light hover:border-brand-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base mt-2"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        {loading && <LoadingSpinner text="正在注册..." />}

        <p className="mt-6 mb-8 text-center text-sm text-text-secondary">
          已有账号？{' '}
          <Link to="/login" className="text-brand-primary font-medium hover:underline">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
