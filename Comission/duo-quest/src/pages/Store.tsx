import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Product, Redemption } from '../types';

export default function Store() {
  const { user, products, redemptions, createProduct, updateProduct, buyProduct, deleteProduct, shipProduct } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<'all' | 'redeemed'>('all');

  // Close edit modal if selected product no longer exists or has been redeemed
  useEffect(() => {
    if (showEditModal && selectedProduct) {
      const productStillExists = products.find(p => p.id === selectedProduct.id);
      const productIsRedeemed = redemptions.some(r => r.product_id === selectedProduct.id);
      
      // Close modal if product was redeemed by someone else
      if (productIsRedeemed || !productStillExists) {
        setShowEditModal(false);
        setSelectedProduct(null);
      }
    }
  }, [products, redemptions, showEditModal, selectedProduct]);

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    await createProduct({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string),
    });

    setShowCreateModal(false);
  };

  const handleEditProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    await updateProduct(selectedProduct.id, {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseInt(formData.get('price') as string),
    });

    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleBuyProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setShowConfirmModal(true);
    }
  };

  const confirmBuyProduct = async () => {
    if (selectedProduct) {
      await buyProduct(selectedProduct.id);
      setShowConfirmModal(false);
      setSelectedProduct(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('确定删除此商品吗？')) {
      await deleteProduct(productId);
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleShipProduct = async (redemptionId: string) => {
    await shipProduct(redemptionId);
  };

  // Get redemptions where user is the seller (needs to ship)
  const pendingShipments = redemptions.filter(r => r.seller_id === user?.id && r.status === 'pending_shipment');

  // Get all redeemed product IDs (for both buyer and seller)
  const allRedeemedProductIds = new Set(redemptions.map(r => r.product_id));

  // Filter products
  const filteredProducts = products.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'redeemed') return allRedeemedProductIds.has(p.id);
    return true;
  });

  // Separate products by redeemed status
  const availableProducts = filteredProducts.filter(p => !allRedeemedProductIds.has(p.id));
  const redeemedProducts = filteredProducts.filter(p => allRedeemedProductIds.has(p.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">积分商城</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + 添加商品
        </button>
      </div>

      {/* User Points */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-100 text-sm">我的积分</p>
            <p className="text-3xl font-bold">{user?.points}</p>
          </div>
          <div className="text-4xl">🛍️</div>
        </div>
      </div>

      {/* Pending Shipments */}
      {pendingShipments.length > 0 && (
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
          <h3 className="font-bold text-orange-800 mb-3">待发货</h3>
          <div className="space-y-2">
            {pendingShipments.map(redemption => (
              <div key={redemption.id} className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{redemption.product_name}</p>
                  <p className="text-xs text-gray-500">买家：{redemption.buyer_name}</p>
                </div>
                <button
                  onClick={() => handleShipProduct(redemption.id)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600"
                >
                  发货
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          全部商品
        </button>
        <button
          onClick={() => setFilter('redeemed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'redeemed'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          已兑换
        </button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-gray-400 mb-2">暂无商品</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-indigo-600 font-medium"
          >
            添加第一个商品
          </button>
        </div>
      ) : (
        <>
          {/* Available Products */}
          {(filter === 'all' || filter === 'redeemed') && availableProducts.length > 0 && filter !== 'redeemed' && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3">可兑换商品</h3>
              <div className="grid grid-cols-2 gap-4">
                {availableProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    {/* Product Image Placeholder */}
                    <div className="bg-gradient-to-br from-indigo-100 to-purple-100 h-32 flex items-center justify-center">
                      <span className="text-5xl">🎁</span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description || '暂无描述'}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-yellow-500">{product.price}</span>
                        <span className="text-xs text-gray-400">积分</span>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleBuyProduct(product.id)}
                          disabled={user!.points < product.price || product.creator_id === user?.id}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                            user!.points >= product.price && product.creator_id !== user?.id
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {product.creator_id === user?.id ? '自己的商品' : user!.points >= product.price ? '兑换' : '积分不足'}
                        </button>

                        {product.creator_id === user?.id && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="px-4 bg-red-100 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Redeemed Products */}
          {(filter === 'all' || filter === 'redeemed') && redeemedProducts.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3">已兑换商品</h3>
              <div className="grid grid-cols-2 gap-4">
                {redeemedProducts.map(product => (
                  <div key={product.id} className="bg-gray-50 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                    {/* Product Image Placeholder */}
                    <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-32 flex items-center justify-center">
                      <span className="text-5xl">✅</span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-600 mb-1">{product.name}</h3>
                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">{product.description || '暂无描述'}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-gray-500">{product.price}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">已兑换</span>
                      </div>

                      <p className="text-xs text-gray-400 text-center">此商品已有人兑换</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show message when viewing redeemed but none exist */}
          {filter === 'redeemed' && redeemedProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-400">暂无已兑换商品</p>
            </div>
          )}
        </>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">添加商品</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="例如：按摩服务"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="描述商品内容..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  积分价格：<span className="text-indigo-600 font-bold" id="priceValue">50</span>
                </label>
                <input
                  name="price"
                  type="range"
                  min="1"
                  max="200"
                  defaultValue="50"
                  onChange={(e) => document.getElementById('priceValue')!.textContent = e.target.value}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>200</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                添加商品
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">编辑商品</h3>
              <button onClick={() => { setShowEditModal(false); setSelectedProduct(null); }} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={selectedProduct.name}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品描述</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={selectedProduct.description}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  积分价格：<span className="text-indigo-600 font-bold" id="editPriceValue">{selectedProduct.price}</span>
                </label>
                <input
                  name="price"
                  type="range"
                  min="1"
                  max="200"
                  defaultValue={selectedProduct.price}
                  onChange={(e) => document.getElementById('editPriceValue')!.textContent = e.target.value}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
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

      {/* Confirm Exchange Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">确认兑换</h3>
              <button onClick={() => { setShowConfirmModal(false); setSelectedProduct(null); }} className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-6 mb-4">
                <div className="text-center text-5xl mb-3">🎁</div>
                <h4 className="font-bold text-gray-800 text-center">{selectedProduct.name}</h4>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">商品价格</span>
                  <span className="font-bold text-yellow-600">{selectedProduct.price} 积分</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">你的积分</span>
                  <span className={`font-bold ${user!.points >= selectedProduct.price ? 'text-green-600' : 'text-red-600'}`}>
                    {user!.points} 积分
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-600">兑换后剩余</span>
                  <span className={`font-bold ${user!.points - selectedProduct.price >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {user!.points - selectedProduct.price} 积分
                  </span>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  💡 兑换后商品将自动下架，卖家需要在订单管理中发货。
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={confirmBuyProduct}
                disabled={user!.points < selectedProduct.price}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  user!.points >= selectedProduct.price
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {user!.points >= selectedProduct.price ? '确认兑换' : '积分不足'}
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setSelectedProduct(null); }}
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
