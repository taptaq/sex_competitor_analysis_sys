import React, { useState, useEffect } from "react";
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
  X,
  FlaskConical,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { currentView, setCurrentView } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navItems = [
    {
      type: ViewType.DASHBOARD,
      icon: <LayoutDashboard size={20} />,
      label: "竞品列表",
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
    {
      type: ViewType.STANDARDIZATION_LAB,
      icon: <FlaskConical size={20} />,
      label: "产品测谎仪",
    },
    {
      type: ViewType.THINKING_WALL,
      icon: <FileText size={20} />, // Reusing FileText or getting StickyNote if imported
      label: "思考墙",
    },
    {
      type: ViewType.MEDICAL_VOCAB,
      icon: <BookOpen size={20} />,
      label: "医疗语境词库",
    },
  ];

  const sidebarClasses = `
    bg-slate-900 text-white flex flex-col h-screen 
    transition-all duration-300 
    ${isMobile ? "fixed inset-y-0 left-0 z-50 w-80 shadow-2xl" : "sticky top-0"}
    ${!isMobile && isCollapsed ? "w-20" : "w-80"}
    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div
          className={`p-6 flex items-center ${
            !isMobile && isCollapsed
              ? "justify-center"
              : "justify-between gap-3"
          } border-b border-slate-800 transition-all`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shrink-0">
              <BarChart2 size={20} />
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="text-lg font-bold tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">
                情趣用品竞品智能分析系统
              </span>
            )}
          </div>
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-x-hidden overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setCurrentView(item.type);
                if (isMobile && onClose) onClose();
              }}
              className={`w-full flex items-center ${
                !isMobile && isCollapsed ? "justify-center" : "gap-3 px-4"
              } py-3 rounded-lg transition-colors ${
                currentView === item.type
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              title={!isMobile && isCollapsed ? item.label : ""}
            >
              {item.icon}
              {(!isCollapsed || isMobile) && (
                <span className="font-medium whitespace-nowrap transition-opacity duration-300">
                  {item.label}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!isMobile && (
          <div className="p-3 border-t border-slate-800">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full flex items-center ${
                isCollapsed ? "justify-center" : "gap-3 px-4"
              } py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors`}
              title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {isCollapsed ? (
                <ChevronRight size={20} />
              ) : (
                <ChevronLeft size={20} />
              )}
              {!isCollapsed && (
                <span className="font-medium whitespace-nowrap">
                  收起侧边栏
                </span>
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
