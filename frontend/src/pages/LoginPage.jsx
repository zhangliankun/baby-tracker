import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Baby } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    if (!password) {
      toast.error('请输入密码');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ username: username.trim(), password });
      if (res.success) {
        login(res.data);
        toast.success('登录成功');
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      {/* 顶部装饰区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full bg-brand-secondary-light flex items-center justify-center mb-4 shadow-sm">
          <Baby className="w-10 h-10 text-brand-primary" />
        </div>
        <h1 className="text-h1 text-brand-primary mb-1">宝宝记录</h1>
        <p className="text-sm text-text-secondary mb-8">婴儿喂养记录与统计分析</p>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              用户名
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              密码
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* 加载动画 */}
        {loading && <LoadingSpinner text="正在登录..." />}

        {/* 注册入口 */}
        <p className="mt-6 text-sm text-text-secondary">
          还没有账号？{' '}
          <Link to="/register" className="text-brand-primary font-medium hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
