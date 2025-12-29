import React from "react";
import { useStore } from "../store";
import { ViewType } from "../types";
import { LayoutDashboard, Zap, BarChart2, GitCompare, FileText, BookOpen } from "lucide-react";

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useStore();

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
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2 border-b border-slate-800">
        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
          <BarChart2 size={20} />
        </div>
        <span className="text-xl font-bold tracking-tight">
          竞品情报分析平台
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.type}
            onClick={() => setCurrentView(item.type)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              currentView === item.type
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
