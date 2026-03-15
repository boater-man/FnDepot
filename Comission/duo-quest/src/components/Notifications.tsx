import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Redemption, Task } from '../types';

export type NotificationType = 'shipment' | 'task_review' | 'confirm_receipt';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export default function Notifications() {
  const { user, redemptions, tasks } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate notifications from redemptions and tasks
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Shipment notifications (seller needs to ship) - only pending_shipment
    redemptions
      .filter(r => r.seller_id === user?.id && r.status === 'pending_shipment')
      .forEach(r => {
        newNotifications.push({
          id: `ship-${r.id}`,
          type: 'shipment',
          title: '待发货通知',
          message: `${r.buyer_name} 兑换了你的商品 "${r.product_name}"，请及时发货`,
          data: { redemptionId: r.id },
          read: false,
          createdAt: new Date(r.created_at)
        });
      });

    // Task review notifications (creator needs to review) - only pending_review
    tasks
      .filter(t => t.creator_id === user?.id && t.status === 'pending_review')
      .forEach(t => {
        newNotifications.push({
          id: `review-${t.id}`,
          type: 'task_review',
          title: '任务待审核',
          message: `${t.assignee_name} 提交了任务 "${t.title}"，请审核`,
          data: { taskId: t.id },
          read: false,
          createdAt: new Date()
        });
      });

    // Confirm receipt notifications (buyer needs to confirm) - only shipped
    redemptions
      .filter(r => r.buyer_id === user?.id && r.status === 'shipped')
      .forEach(r => {
        newNotifications.push({
          id: `receipt-${r.id}`,
          type: 'confirm_receipt',
          title: '待确认收货',
          message: `卖家已发货 "${r.product_name}"，请确认收货`,
          data: { redemptionId: r.id },
          read: false,
          createdAt: new Date()
        });
      });

    setNotifications(newNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
  }, [redemptions, tasks, user]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    setNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));

    // Navigate to appropriate page
    if (notification.type === 'shipment') {
      // Go to Orders page (sold tab)
      window.location.href = '/orders';
    } else if (notification.type === 'task_review') {
      // Go to Tasks page
      // User can review from there
    } else if (notification.type === 'confirm_receipt') {
      // Go to Orders page (bought tab)
      window.location.href = '/orders';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'shipment': return '📦';
      case 'task_review': return '📝';
      case 'confirm_receipt': return '✅';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => document.getElementById('notification-dropdown')?.classList.toggle('hidden')}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div id="notification-dropdown" className="hidden absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">通知中心</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-red-500">{unreadCount} 条未读</span>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🔔</div>
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
