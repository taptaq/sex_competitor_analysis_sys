import React from "react";
import { Product } from "../../types";
import { X } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PriceChartModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const PriceChartModal: React.FC<PriceChartModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !product) return null;

  const hasOriginalPrice = product.priceHistory?.some(
    (h) => h.originalPrice !== undefined
  );
  const finalPrices = product.priceHistory?.map((h) => h.finalPrice) || [];
  const originalPrices =
    product.priceHistory
      ?.map((h) => h.originalPrice)
      .filter((p): p is number => p !== undefined) || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {product.name} - 价格走势图
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {product.priceHistory?.length || 0} 条价格记录
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 图表内容 */}
        <div className="flex-1 p-6 overflow-auto">
          {product.priceHistory && product.priceHistory.length > 0 ? (
            <div className="space-y-4">
              {/* 价格统计信息 */}
              <div
                className={`grid gap-4 mb-4 ${
                  hasOriginalPrice ? "grid-cols-4" : "grid-cols-3"
                }`}
              >
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    最低到手价
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    ¥{Math.min(...finalPrices).toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <p className="text-xs text-red-600 font-medium mb-1">
                    最高到手价
                  </p>
                  <p className="text-lg font-bold text-red-700">
                    ¥{Math.max(...finalPrices).toFixed(2)}
                  </p>
                </div>
                {hasOriginalPrice && originalPrices.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-600 font-medium mb-1">
                      最低页面价
                    </p>
                    <p className="text-lg font-bold text-orange-700">
                      ¥{Math.min(...originalPrices).toFixed(2)}
                    </p>
                  </div>
                )}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    当前价格
                  </p>
                  <p className="text-lg font-bold text-purple-700">
                    ¥{product.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* 价格走势图 */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={product.priceHistory.map((h) => ({
                      date: h.date,
                      finalPrice: h.finalPrice,
                      originalPrice: h.originalPrice,
                      dateLabel: new Date(h.date).toLocaleDateString("zh-CN", {
                        month: "short",
                        day: "numeric",
                      }),
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="dateLabel"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      label={{
                        value: "价格 (¥)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        `¥${value.toFixed(2)}`,
                        name === "finalPrice" ? "到手价" : "页面价",
                      ]}
                      labelFormatter={(label) => `日期: ${label}`}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "finalPrice" ? "到手价" : "页面价"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="finalPrice"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="finalPrice"
                    />
                    {hasOriginalPrice && (
                      <Line
                        type="monotone"
                        dataKey="originalPrice"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: "#f97316", r: 4 }}
                        activeDot={{ r: 6 }}
                        name="originalPrice"
                        strokeDasharray="5 5"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 价格数据表格 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  价格历史数据
                </h3>
                <div className="max-h-60 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-700">
                          日期
                        </th>
                        <th className="px-3 py-2 text-right font-bold text-gray-700">
                          到手价
                        </th>
                        {hasOriginalPrice && (
                          <th className="px-3 py-2 text-right font-bold text-gray-700">
                            页面价
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {product.priceHistory
                        .slice()
                        .reverse()
                        .map((h, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-3 py-2 text-gray-600">
                              {new Date(h.date).toLocaleDateString("zh-CN")}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-blue-700">
                              ¥{h.finalPrice.toFixed(2)}
                            </td>
                            {hasOriginalPrice && (
                              <td className="px-3 py-2 text-right font-medium text-orange-700">
                                {h.originalPrice !== undefined
                                  ? `¥${h.originalPrice.toFixed(2)}`
                                  : "-"}
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">暂无价格历史数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceChartModal;

