import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const { user, setUser, team, isLoading, login, generateCode, joinTeam, members } = useApp();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'login' | 'create' | 'join'>('login');
  const [error, setError] = useState('');

  // Check for saved user
  useEffect(() => {
    const savedUser = localStorage.getItem('duoquest_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        } else {
          // Invalid user data, clear it
          localStorage.removeItem('duoquest_user');
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
        localStorage.removeItem('duoquest_user');
      }
    }
  }, [setUser]);

  const handleLogout = () => {
    localStorage.removeItem('duoquest_user');
    setUser(null);
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    setError('');
    await login(username.trim());
    const savedUser = localStorage.getItem('duoquest_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
    }
  };

  const handleGenerateCode = async () => {
    setError('');
    try {
      await generateCode();
    } catch (e: any) {
      setError(e.response?.data?.error || '生成失败');
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('请输入组队码');
      return;
    }
    setError('');
    try {
      await joinTeam(code.trim().toUpperCase());
    } catch (e: any) {
      setError(e.response?.data?.error || '加入失败，请检查组队码');
    }
  };

  // Show team view if user has team
  if (user && team) {
    const partner = members.find(m => m.id !== user.id);
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl font-bold">DQ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DuoQuest</h1>
          <p className="text-gray-500 mb-6">双人任务协作应用</p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-700 font-medium">组队成功</span>
            </div>
            <p className="text-sm text-gray-600">组队码: <span className="font-mono font-bold">{team.pairing_code}</span></p>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">你的用户名</p>
              <p className="font-bold text-lg text-gray-800">{user.username}</p>
            </div>

            {partner ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">队友</p>
                <p className="font-bold text-lg text-green-600">{partner.username}</p>
                <p className="text-sm text-gray-500 mt-2">积分: {partner.points}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-700">等待队友加入...</p>
                <p className="text-xs text-yellow-600 mt-2">将组队码分享给队友</p>
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            进入应用
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">CM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">CoMission</h1>
          <p className="text-gray-500">双人任务协作应用</p>
        </div>

        {!user ? (
          // Login Form
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入你的昵称"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? '登录中...' : '开始使用'}
            </button>
          </form>
        ) : (
          // Team Options
          <div className="space-y-4">
            <div className="text-center mb-6">
              <p className="text-gray-600">欢迎, <span className="font-bold text-indigo-600">{user.username}</span></p>
              <p className="text-sm text-gray-500 mt-1">请选择创建或加入组队</p>
            </div>

            {/* Create Team */}
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>创建组队</span>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或</span>
              </div>
            </div>

            {/* Join Team */}
            <form onSubmit={handleJoinTeam}>
              <div className="mb-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="输入6位组队码"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center text-2xl font-mono tracking-wider"
                />
              </div>

              {error && (
                <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                加入组队
              </button>
            </form>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
