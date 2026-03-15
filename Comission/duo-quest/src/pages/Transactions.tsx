import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import * as api from '../services/api';
import type { Transaction } from '../types';

export default function Transactions() {
  const { user } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    if (user) {
      api.getTransactions(user.id).then(setTransactions);
    }
  }, [user]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const totalEarned = transactions
    .filter(t => t.type === 'earn')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(t => t.type === 'spend')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-800">积分记录</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💰</span>
              <span className="text-sm text-green-600 font-medium">累计获得</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalEarned}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl">💸</span>
              <span className="text-sm text-red-600 font-medium">累计消费</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{totalSpent}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'earn', 'spend'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? '全部' : f === 'earn' ? '获得' : '消费'}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400">暂无记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <span className="text-xl">
                        {tx.type === 'earn' ? '💰' : '💸'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {tx.type === 'earn' ? '获得积分' : '消费积分'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${
                    tx.type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'earn' ? '+' : ''}{tx.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
