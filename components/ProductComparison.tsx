import React from "react";
import { Product } from "../types";
import {
  DollarSign,
  Tag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";

interface ProductComparisonProps {
  products: Product[];
}

const ProductComparison: React.FC<ProductComparisonProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-gray-500">
          请先在"核心产品"选项卡中勾选要对比的产品
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] table-fixed border-collapse bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-40">
              对比维度
            </th>
            {products.map((product) => (
              <th
                key={product.id}
                className="p-4 text-left border-b border-gray-200"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-sm font-bold text-gray-800 text-center line-clamp-2">
                    {product.name}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {/* Price Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <DollarSign size={14} className="text-green-600" /> 销售价格
              </div>
            </td>
            {products.map((product) => (
              <td
                key={product.id}
                className="p-4 text-sm font-bold text-purple-600"
              >
                ¥{product.price}
              </td>
            ))}
          </tr>

          {/* Tags Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Tag size={14} className="text-blue-600" /> 核心卖点
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="flex flex-wrap gap-1">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </td>
            ))}
          </tr>

          {/* Pros Summary Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <ThumbsUp size={14} className="text-green-500" /> 用户好评
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                {product.analysis ? (
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {product.analysis.pros.slice(0, 3).map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                    {product.analysis.pros.length > 3 && (
                      <li className="list-none text-[10px] text-gray-400">
                        ...更多在详情卡片
                      </li>
                    )}
                  </ul>
                ) : (
                  <span className="text-xs text-gray-400 italic">暂无分析</span>
                )}
              </td>
            ))}
          </tr>

          {/* Cons Summary Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <ThumbsDown size={14} className="text-red-500" /> 需优化点
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                {product.analysis ? (
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                    {product.analysis.cons.slice(0, 3).map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                    {product.analysis.cons.length > 3 && (
                      <li className="list-none text-[10px] text-gray-400">
                        ...更多在详情卡片
                      </li>
                    )}
                  </ul>
                ) : (
                  <span className="text-xs text-gray-400 italic">暂无分析</span>
                )}
              </td>
            ))}
          </tr>

          {/* General Summary Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <MessageSquare size={14} className="text-purple-400" /> 综合评价
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {product.analysis?.summary || "暂无数据"}
                </p>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ProductComparison;
