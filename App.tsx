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
import StandardizationLab from "./components/StandardizationLab";
import MedicalVocabLab from "./components/MedicalVocabLab";

import { Menu } from "lucide-react";

const App: React.FC = () => {
  const { currentView, fetchCompetitors, fetchFavorites, fetchDeepReports } =
    useStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

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
      case ViewType.STANDARDIZATION_LAB:
        return <StandardizationLab />;
      case ViewType.MEDICAL_VOCAB:
        return <MedicalVocabLab />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto flex flex-col h-full w-full">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-700 capitalize truncate max-w-[200px] md:max-w-none">
              {currentView.replace("_", " ")}
            </h2>
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
