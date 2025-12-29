import React, { useEffect } from "react";
import { useStore } from "./store";
import { ViewType } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CompetitorDetail from "./components/CompetitorDetail";
import ProductForge from "./components/ProductForge";
import GlobalProductComparison from "./components/GlobalProductComparison";
import CompetitorReportAnalysis from "./components/CompetitorReportAnalysis";
import ProductKnowledgeBase from "./components/ProductKnowledgeBase";

const App: React.FC = () => {
  const { currentView, fetchCompetitors, fetchFavorites, fetchDeepReports } = useStore();

  useEffect(() => {
    fetchCompetitors();
    fetchFavorites();
    fetchDeepReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case ViewType.DASHBOARD:
        return <Dashboard />;
      case ViewType.COMPETITOR_DETAIL:
        return <CompetitorDetail />;
      case ViewType.STRATEGY_ADVISOR:
        return <ProductForge />;
      case ViewType.PRODUCT_COMPARISON:
        return <GlobalProductComparison />;
      case ViewType.COMPETITOR_REPORT:
        return <CompetitorReportAnalysis />;
      case ViewType.PRODUCT_KNOWLEDGE_BASE:
        return <ProductKnowledgeBase />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0" style={{ zIndex: 1000 }}>
          <h2 className="text-lg font-semibold text-gray-700 capitalize">
            {currentView.replace("_", " ")}
          </h2>
        </header>
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
