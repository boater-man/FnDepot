import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Transaction } from '../types';

export default function Profile() {
  const { user, setUser, team, members, leaveTeam, isLoading } = useApp();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const partner = members.find(m => m.id !== user?.id);

  const handleLeaveTeam = async () => {
    await leaveTeam();
    setShowLeaveConfirm(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{user?.username?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800">{user?.username}</h2>
            <p className="text-sm text-gray-500">ID: {user?.id.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 text-center">
          <div className="bg-yellow-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-yellow-600">{user?.points}</p>
            <p className="text-xs text-yellow-600">当前积分</p>
          </div>
        </div>
      </div>

      {/* Team Info */}
      {team && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">组队信息</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">组队码</span>
              <span className="font-mono font-bold text-indigo-600">{team.pairing_code}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">队友</span>
              <span className="font-bold text-gray-800">{partner?.username || '等待中...'}</span>
            </div>

            {partner && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">队友积分</span>
                <span className="font-bold text-yellow-600">{partner.points}</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">
              ⚠️ 退出组队将清空双方所有积分，请谨慎操作
            </p>
          </div>

          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full mt-4 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            退出组队
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => window.location.href = '/orders'}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <span className="font-bold text-gray-800">订单管理</span>
          </div>
          <p className="text-sm text-gray-500">查看买入/卖出订单</p>
        </button>

        <button
          onClick={() => window.location.href = '/transactions'}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <span className="font-bold text-gray-800">积分记录</span>
          </div>
          <p className="text-sm text-gray-500">查看积分收支明细</p>
        </button>
      </div>

      {/* Leave Team Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">确定退出组队？</h3>
            </div>

            <p className="text-gray-600 text-center mb-6">
              退出后将清空你和队友的所有积分，且无法恢复。
            </p>

            <div className="space-y-3">
              <button
                onClick={handleLeaveTeam}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? '处理中...' : '确定退出'}
              </button>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
