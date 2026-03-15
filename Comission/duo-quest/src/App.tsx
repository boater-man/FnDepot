import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Store from './pages/Store';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import './App.css';

type Tab = 'dashboard' | 'tasks' | 'store' | 'profile';
type Page = 'landing' | 'main' | 'orders' | 'transactions';

function AppContent() {
  const { user, team, members } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  // Handle routing based on URL path
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/orders') {
        setCurrentPage('orders');
      } else if (path === '/transactions') {
        setCurrentPage('transactions');
      } else if (user && team) {
        setCurrentPage('main');
      } else {
        setCurrentPage('landing');
      }
    };

    // Initial check
    handleLocationChange();

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [user, team]);

  // Check if user is logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('duoquest_user');
    if (savedUser) {
      // We can't set user here directly, need to handle in context
    }
  }, []);

  // Render standalone pages
  if (currentPage === 'orders') {
    return <Orders />;
  }

  if (currentPage === 'transactions') {
    return <Transactions />;
  }

  if (!user || !team) {
    return <Landing />;
  }

  const partner = members.find(m => m.id !== user.id);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'store':
        return <Store />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">CM</span>
              </div>
              <span className="font-bold text-gray-800">CoMission</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-full">
                <span className="text-yellow-500">⭐</span>
                <span className="font-bold text-yellow-600">{user.points}</span>
              </div>
              {partner ? (
                <div className="flex items-center space-x-1 bg-green-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm text-green-600">{partner.username}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  <span className="text-sm text-gray-500">等待队友...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs mt-1">首页</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'tasks'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs mt-1">任务</span>
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'store'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs mt-1">商城</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-1">我的</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
