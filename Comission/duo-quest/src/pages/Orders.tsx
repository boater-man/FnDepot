import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Redemption } from '../types';

export default function Orders() {
  const { user, redemptions, shipProduct, confirmReceipt } = useApp();
  const [activeTab, setActiveTab] = useState<'bought' | 'sold'>('bought');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);

  const handleShipProduct = async (redemptionId: string) => {
    await shipProduct(redemptionId);
  };

  const handleConfirmExchange = async (redemption: Redemption) => {
    setSelectedRedemption(redemption);
    setShowConfirmModal(true);
  };

  const handleConfirmReceipt = async () => {
    if (selectedRedemption) {
      await confirmReceipt(selectedRedemption.id);
      setShowConfirmModal(false);
      setSelectedRedemption(null);
    }
  };

  // Get redemptions where user is the buyer
  const myBoughtRedemptions = redemptions.filter(r => r.buyer_id === user?.id);

  // Get redemptions where user is the seller
  const mySoldRedemptions = redemptions.filter(r => r.seller_id === user?.id);

  const currentRedemptions = activeTab === 'bought' ? myBoughtRedemptions : mySoldRedemptions;

  const getBuyerStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">待发货</span>;
      case 'shipped':
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">已发货</span>;
      case 'received':
        return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已完成</span>;
    }
  };

  const getSellerStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">待发货</span>;
      case 'shipped':
        return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">已发货</span>;
      case 'received':
        return <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已完成</span>;
    }
  };

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
              <h1 className="text-lg font-bold text-gray-800">订单管理</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab('bought')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'bought'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            我买到的
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'sold'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            我卖出的
          </button>
        </div>

        {/* Order List */}
        {currentRedemptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-400">暂无订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentRedemptions.map(redemption => (
              <div key={redemption.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{redemption.product_name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>积分：{redemption.product_price}</span>
                      <span>•</span>
                      <span>{new Date(redemption.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {activeTab === 'bought' ? (
                      getBuyerStatusBadge(redemption.status)
                    ) : (
                      getSellerStatusBadge(redemption.status)
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {activeTab === 'bought' ? (
                      <span>卖家：{redemption.seller_name}</span>
                    ) : (
                      <span>买家：{redemption.buyer_name}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeTab === 'sold' && redemption.status === 'pending_shipment' && (
                      <button
                        onClick={() => handleShipProduct(redemption.id)}
                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                      >
                        发货
                      </button>
                    )}
                    {activeTab === 'bought' && redemption.status === 'shipped' && (
                      <button
                        onClick={() => handleConfirmExchange(redemption)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        确认收货
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Confirm Receipt Modal */}
      {showConfirmModal && selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">确认收货</h3>
              <p className="text-gray-600">请确认您已收到商品</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-bold text-gray-800 mb-1">{selectedRedemption.product_name}</p>
              <p className="text-sm text-gray-500">积分：{selectedRedemption.product_price}</p>
              <p className="text-sm text-gray-500">卖家：{selectedRedemption.seller_name}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmReceipt}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                确认收到
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedRedemption(null);
                }}
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
