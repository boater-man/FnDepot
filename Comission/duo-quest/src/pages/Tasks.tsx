import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Task, TaskType } from '../types';

export default function Tasks() {
  const { user, tasks, createTask, updateTask, acceptTask, completeTask, approveTask, rejectTask, deleteTask, members, refreshTasks } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'accepted' | 'pending_review' | 'completed'>('open');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const partner = members.find(m => m.id !== user?.id);
  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  // Close edit modal if task status changed (someone else interacted with it)
  useEffect(() => {
    if (showEditModal && selectedTask) {
      const currentTask = tasks.find(t => t.id === selectedTask.id);
      
      // Close modal if task no longer exists or status changed (not open anymore)
      if (!currentTask || currentTask.status !== 'open') {
        setShowEditModal(false);
        setSelectedTask(null);
      }
    }
  }, [tasks, showEditModal, selectedTask]);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    await createTask({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as TaskType,
      rewardPoints: parseInt(formData.get('rewardPoints') as string),
    });

    setShowCreateModal(false);
  };

  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTask) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    await updateTask(selectedTask.id, {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as TaskType,
      rewardPoints: parseInt(formData.get('rewardPoints') as string),
    });

    setShowEditModal(false);
    setSelectedTask(null);
    await refreshTasks();
  };

  const handleAcceptTask = async (taskId: string) => {
    await acceptTask(taskId);
    await refreshTasks();
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    await completeTask(selectedTask.id, selectedFile || undefined);
    setShowCompleteModal(false);
    setSelectedTask(null);
    setSelectedFile(null);
    await refreshTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('确定删除这个任务吗？')) {
      await deleteTask(taskId);
      await refreshTasks();
    }
  };

  const handleApproveTask = async (taskId: string) => {
    await approveTask(taskId);
    await refreshTasks();
  };

  const handleRejectTask = async () => {
    if (!selectedTask) return;
    await rejectTask(selectedTask.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    setSelectedTask(null);
    await refreshTasks();
  };

  const openRejectModal = (task: Task) => {
    setSelectedTask(task);
    setShowRejectModal(true);
  };

  const openCompleteModal = (task: Task) => {
    setSelectedTask(task);
    setShowCompleteModal(true);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setShowEditModal(true);
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'study': return '📚';
      case 'work': return '💼';
      case 'life': return '🏠';
    }
  };

  const getTypeLabel = (type: TaskType) => {
    switch (type) {
      case 'study': return '学习';
      case 'work': return '工作';
      case 'life': return '生活';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">待接受</span>;
      case 'accepted':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">进行中</span>;
      case 'pending_review':
        return <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">待审核</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已完成</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">已驳回</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">任务大厅</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 发布任务
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {(['all', 'open', 'accepted', 'pending_review', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? '全部' : f === 'open' ? '待接受' : f === 'accepted' ? '进行中' : f === 'pending_review' ? '待审核' : '已完成'}
          </button>
        ))}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 mb-2">暂无任务</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-indigo-600 font-medium"
          >
            发布第一个任务
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div key={task.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${
              task.status === 'completed' ? 'border-green-200 bg-green-50' :
              task.status === 'rejected' ? 'border-red-200 bg-red-50' :
              task.status === 'pending_review' ? 'border-orange-200 bg-orange-50' :
              'border-gray-100'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
                    {getTypeIcon(task.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{task.title}</h3>
                    <p className="text-xs text-gray-500">{getTypeLabel(task.type)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(task.status)}
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-sm font-bold rounded-full">
                    +{task.reward_points}
                  </span>
                </div>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 mb-3">{task.description}</p>
              )}

              {task.proof_image && (
                <div className="mb-3">
                  <img
                    src={task.proof_image}
                    alt="Proof"
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>发布者：{task.creator_name || '未知'}</span>
                {task.assignee_name && <span>接受者：{task.assignee_name}</span>}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {task.status === 'open' && task.creator_id !== user?.id && (
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    接受任务
                  </button>
                )}

                {task.status === 'accepted' && task.assignee_id === user?.id && (
                  <button
                    onClick={() => openCompleteModal(task)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    完成任务
                  </button>
                )}

                {/* Approve/Reject buttons for task creator when pending review */}
                {task.status === 'pending_review' && task.creator_id === user?.id && (
                  <>
                    <button
                      onClick={() => handleApproveTask(task.id)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      批准
                    </button>
                    <button
                      onClick={() => openRejectModal(task)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      驳回
                    </button>
                  </>
                )}

                {/* Show reject reason if rejected */}
                {task.status === 'rejected' && task.reject_reason && (
                  <div className="w-full text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-2">
                    驳回原因：{task.reject_reason}
                  </div>
                )}

                {/* Edit/Delete buttons - only when task is open and user is creator */}
                {task.creator_id === user?.id && task.status === 'open' && (
                  <>
                    <button
                      onClick={() => openEditModal(task)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      删除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">发布任务</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务标题</label>
                <input
                  name="title"
                  type="text"
                  required
                  placeholder="例如：帮我买咖啡"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务描述</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="详细描述任务内容..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['study', 'work', 'life'] as const).map(type => (
                    <label key={type} className="cursor-pointer">
                      <input type="radio" name="type" value={type} defaultChecked={type === 'life'} className="sr-only peer" />
                      <div className="text-center py-3 border-2 border-gray-200 rounded-xl peer-checked:border-indigo-500 peer-checked:bg-indigo-50 transition-colors">
                        <span className="text-2xl">{getTypeIcon(type)}</span>
                        <p className="text-xs mt-1">{getTypeLabel(type)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  积分奖励： <span className="text-indigo-600 font-bold" id="rewardValue">5</span>
                </label>
                <input
                  name="rewardPoints"
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="5"
                  onChange={(e) => document.getElementById('rewardValue')!.textContent = e.target.value}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                发布任务
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">编辑任务</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedTask(null); }} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务标题</label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={selectedTask.title}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务描述</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedTask.description}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">任务类型</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['study', 'work', 'life'] as const).map(type => (
                    <label key={type} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        defaultChecked={type === selectedTask.type}
                        className="sr-only peer"
                      />
                      <div className="text-center py-3 border-2 border-gray-200 rounded-xl peer-checked:border-indigo-500 peer-checked:bg-indigo-50 transition-colors">
                        <span className="text-2xl">{getTypeIcon(type)}</span>
                        <p className="text-xs mt-1">{getTypeLabel(type)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  积分奖励： <span className="text-indigo-600 font-bold" id="editRewardValue">{selectedTask.reward_points}</span>
                </label>
                <input
                  name="rewardPoints"
                  type="range"
                  min="1"
                  max="10"
                  defaultValue={selectedTask.reward_points}
                  onChange={(e) => document.getElementById('editRewardValue')!.textContent = e.target.value}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                保存修改
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Complete Task Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">完成任务</h3>
              <button onClick={() => { setShowCompleteModal(false); setSelectedTask(null); setSelectedFile(null); }} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="font-bold text-gray-800 mb-2">{selectedTask.title}</p>
              <p className="text-sm text-gray-500">完成任务可获得 <span className="text-yellow-500 font-bold">+{selectedTask.reward_points}</span> 积分</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">上传完成凭证</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                {selectedFile ? (
                  <div>
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                    />
                    <p className="text-sm text-gray-500">{selectedFile.name}</p>
                  </div>
                ) : (
                  <div>
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">点击上传图片</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleCompleteTask}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              确认完成
            </button>
          </div>
        </div>
      )}

      {/* Reject Task Modal */}
      {showRejectModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">驳回任务</h3>
              <button onClick={() => { setShowRejectModal(false); setSelectedTask(null); setRejectReason(''); }} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="font-bold text-gray-800 mb-2">{selectedTask.title}</p>
              <p className="text-sm text-gray-500">请输入驳回原因，以便任务接受者了解情况</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="请输入驳回原因..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleRejectTask}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              确认驳回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
