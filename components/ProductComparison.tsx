import React from "react";
import { Product } from "../types";
import {
  DollarSign,
  Tag,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Palette,
  Zap,
  Store,
  Sparkles,
  Star,
  AlertCircle,
  BarChart3,
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
          {/* 外观 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Palette size={14} className="text-pink-500" /> 外观
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="space-y-2">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  )}
                  <p className="text-xs text-gray-600">
                    {product.analysis?.pros?.find(p => p.includes('外观') || p.includes('设计') || p.includes('颜值') || p.includes('造型')) || 
                     product.analysis?.pros?.find(p => p.includes('可爱') || p.includes('精美') || p.includes('美观')) || 
                     '暂无外观评价'}
                  </p>
                </div>
              </td>
            ))}
          </tr>

          {/* 核心功能 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Zap size={14} className="text-yellow-500" /> 核心功能
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {product.analysis && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {product.analysis.pros?.find(p => p.includes('功能') || p.includes('模式') || p.includes('刺激') || p.includes('效果')) || 
                       product.analysis.summary?.substring(0, 100) || 
                       '暂无功能评价'}
                    </p>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* 价格 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <DollarSign size={14} className="text-green-600" /> 价格
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-purple-600">
                    ¥{product.price}
                  </p>
                  {product.analysis && (
                    <p className="text-xs text-gray-500">
                      {product.analysis.cons?.find(c => c.includes('价格') || c.includes('性价比') || c.includes('贵') || c.includes('不值')) ? 
                       '价格反馈：' + product.analysis.cons.find(c => c.includes('价格') || c.includes('性价比') || c.includes('贵') || c.includes('不值')) : 
                       product.analysis.pros?.find(p => p.includes('价格') || p.includes('性价比') || p.includes('划算')) ? 
                       '价格反馈：' + product.analysis.pros.find(p => p.includes('价格') || p.includes('性价比') || p.includes('划算')) : 
                       '暂无价格评价'}
                    </p>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* 市场渠道 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Store size={14} className="text-indigo-500" /> 市场渠道
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="space-y-1">
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      查看产品链接
                    </a>
                  )}
                  {product.analysis && (
                    <p className="text-xs text-gray-600 mt-1">
                      {product.analysis.pros?.find(p => p.includes('物流') || p.includes('包装') || p.includes('发货') || p.includes('渠道')) || 
                       product.analysis.pros?.find(p => p.includes('品牌') || p.includes('口碑') || p.includes('信赖')) || 
                       '暂无渠道信息'}
                    </p>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* 差异化竞争点 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <Sparkles size={14} className="text-purple-500" /> 差异化竞争点
              </div>
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                {product.analysis ? (
                  <div className="space-y-1">
                    {product.analysis.pros?.filter(p => 
                      p.includes('独特') || p.includes('创新') || p.includes('首创') || 
                      p.includes('独家') || p.includes('差异化') || p.includes('领先')
                    ).slice(0, 2).map((pro, i) => (
                      <p key={i} className="text-xs text-gray-600">• {pro}</p>
                    ))}
                    {(!product.analysis.pros?.some(p => 
                      p.includes('独特') || p.includes('创新') || p.includes('首创') || 
                      p.includes('独家') || p.includes('差异化') || p.includes('领先')
                    )) && (
                      <p className="text-xs text-gray-400 italic">暂无差异化信息</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">暂无分析</span>
                )}
              </td>
            ))}
          </tr>

          {/* 用户好评 Row */}
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

          {/* 需优化点 Row */}
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

          {/* 综合评价 Row */}
          <tr>
            <td className="p-4 bg-gray-50/50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <BarChart3 size={14} className="text-purple-400" /> 综合评价
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
