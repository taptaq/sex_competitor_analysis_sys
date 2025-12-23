import React, { useEffect } from "react";
import { useStore } from "./store";
import { ViewType } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import CompetitorDetail from "./components/CompetitorDetail";
import StrategyAdvisor from "./components/StrategyAdvisor";

const App: React.FC = () => {
  const { currentView, fetchCompetitors } = useStore();

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const renderContent = () => {
    switch (currentView) {
      case ViewType.DASHBOARD:
        return <Dashboard />;
      case ViewType.COMPETITOR_DETAIL:
        return <CompetitorDetail />;
      case ViewType.STRATEGY_ADVISOR:
        return <StrategyAdvisor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
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
