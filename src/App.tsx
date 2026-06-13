import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { useUser } from './context/UserContext';
import { useViewerMode } from './context/ViewerModeContext';
import { GroupsPage } from './pages/GroupsPage';
import { SchedulePage } from './pages/SchedulePage';
import { KnockoutPage } from './pages/KnockoutPage';
import './App.css';

function ActiveUserBar() {
  const { activeUser } = useUser();
  const { viewerMode } = useViewerMode();

  if (viewerMode) {
    return (
      <div className="active-user-bar viewer-bar">
        <span className="active-user-banner" data-testid="active-user-banner">
          👁 Viewer mode — showing everyone's guesses (revealed at kickoff).
        </span>
      </div>
    );
  }

  return (
    <div className="active-user-bar">
      <span className="active-user-banner" data-testid="active-user-banner">
        {activeUser
          ? `Betting as ${activeUser.name}`
          : 'No active user — add one in the header to start betting.'}
      </span>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Header />
      <ActiveUserBar />
      <main className="app">
        <Routes>
          <Route path="/" element={<GroupsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/knockout" element={<KnockoutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
