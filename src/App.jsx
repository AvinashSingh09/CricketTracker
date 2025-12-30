import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navigation from './components/Navigation';
import PlayersPage from './pages/PlayersPage';
import TeamsPage from './pages/TeamsPage';
import MatchSetupPage from './pages/MatchSetupPage';
import ScoringPage from './pages/ScoringPage';
import SummaryPage from './pages/SummaryPage';
import HistoryPage from './pages/HistoryPage';
import './index.css';

function AppContent() {
  const { match } = useApp();
  const [currentPage, setCurrentPage] = useState('players');

  // Auto-navigate based on match status
  useEffect(() => {
    if (match.status === 'live') {
      setCurrentPage('score');
    } else if (match.status === 'complete' || match.status === 'innings_complete') {
      setCurrentPage('summary');
    }
  }, [match.status]);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleStartMatch = () => {
    setCurrentPage('score');
  };

  const handleEndMatch = () => {
    setCurrentPage('summary');
  };

  const handleNewMatch = () => {
    setCurrentPage('players');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'players':
        return <PlayersPage />;
      case 'teams':
        return <TeamsPage />;
      case 'match':
        return <MatchSetupPage onStartMatch={handleStartMatch} />;
      case 'score':
        return <ScoringPage onEndMatch={handleEndMatch} />;
      case 'summary':
        return <SummaryPage onNewMatch={handleNewMatch} />;
      case 'history':
        return <HistoryPage />;
      default:
        return <PlayersPage />;
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 header-gradient">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                🏏
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight">Cricket Tracker</h1>
                <p className="text-xs text-gray-500">Office Tournament</p>
              </div>
            </div>
            {match.status === 'live' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="live-dot"></div>
                <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Live</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {renderPage()}
      </main>

      {/* Navigation */}
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
