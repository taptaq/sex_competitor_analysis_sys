import React, { useState } from "react";
import { useStore } from "../store";
import { ViewType } from "../types";
import {
  LayoutDashboard,
  Zap,
  BarChart2,
  GitCompare,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      type: ViewType.DASHBOARD,
      icon: <LayoutDashboard size={20} />,
      label: "仪表盘首页",
    },
    {
      type: ViewType.PRODUCT_COMPARISON,
      icon: <GitCompare size={20} />,
      label: "产品多维度对比",
    },
    {
      type: ViewType.COMPETITOR_REPORT,
      icon: <FileText size={20} />,
      label: "竞品报告分析",
    },
    {
      type: ViewType.PRODUCT_KNOWLEDGE_BASE,
      icon: <BookOpen size={20} />,
      label: "产品知识库查询",
    },
    {
      type: ViewType.STRATEGY_ADVISOR,
      icon: <Zap size={20} />,
      label: "产品技术验证",
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-slate-900 text-white flex flex-col h-screen sticky top-0 transition-all duration-300 relative`}
    >
      <div
        className={`p-6 flex items-center ${
          isCollapsed ? "justify-center" : "gap-3"
        } border-b border-slate-800 transition-all`}
      >
        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shrink-0">
          <BarChart2 size={20} />
        </div>
        {!isCollapsed && (
          <span className="text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">
            竞品情报
          </span>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-x-hidden">
        {navItems.map((item) => (
          <button
            key={item.type}
            onClick={() => setCurrentView(item.type)}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center" : "gap-3 px-4"
            } py-3 rounded-lg transition-colors ${
              currentView === item.type
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title={isCollapsed ? item.label : ""}
          >
            {item.icon}
            {!isCollapsed && (
              <span className="font-medium whitespace-nowrap transition-opacity duration-300">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${
            isCollapsed ? "justify-center" : "gap-3 px-4"
          } py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors`}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && (
            <span className="font-medium whitespace-nowrap">收起侧边栏</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
