import { useApp } from '../context/AppContext';
import Notifications from '../components/Notifications';

export default function Dashboard() {
  const { user, team, members, tasks, products } = useApp();

  const partner = members.find(m => m.id !== user?.id);

  // Stats
  const myTasks = tasks.filter(t => t.creator_id === user?.id || t.assignee_id === user?.id);
  const openTasks = tasks.filter(t => t.status === 'open');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalPointsEarned = myTasks.filter(t => t.status === 'completed' && t.assignee_id === user?.id).reduce((sum, t) => sum + t.reward_points, 0);

  return (
    <div className="space-y-6">
      {/* Header with Notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">CM</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800">CoMission</h2>
        </div>
        <Notifications />
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">你好，{user?.username}!</h2>
        <p className="text-indigo-100 text-sm">今天是协作的一天</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-xs">我的积分</p>
            <p className="text-3xl font-bold">{user?.points}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-xs">组队码</p>
            <p className="text-2xl font-mono font-bold">{team?.pairing_code}</p>
          </div>
        </div>
      </div>

      {/* Partner Card */}
      {partner ? (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{partner.username.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-gray-800">{partner.username}</p>
                <p className="text-sm text-gray-500">队友</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-yellow-500">{partner.points}</p>
              <p className="text-xs text-gray-400">积分</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600">⏳</span>
            </div>
            <div>
              <p className="font-medium text-yellow-800">等待队友加入</p>
              <p className="text-sm text-yellow-600">分享组队码给朋友</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-indigo-600">{openTasks.length}</p>
          <p className="text-xs text-gray-500">待接受</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
          <p className="text-xs text-gray-500">已完成</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-2xl font-bold text-purple-600">{products.length}</p>
          <p className="text-xs text-gray-500">商品</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">最近任务</h3>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>暂无任务</p>
            <p className="text-sm mt-1">去任务页面创建吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 3).map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    task.type === 'study' ? 'bg-blue-100' :
                    task.type === 'work' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    {task.type === 'study' ? '📚' : task.type === 'work' ? '💼' : '🏠'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.status === 'open' ? '待接受' : task.status === 'accepted' ? '进行中' : '已完成'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-500">+{task.reward_points}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
