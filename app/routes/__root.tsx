import {
  Outlet,
  createRootRouteWithContext,
  Link,
  useRouterState,
} from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getGarageStore } from '../../src/garage/GarageStore';

function NavBar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const store = getGarageStore();
    setCoins(store.getTotalCoins());
    const unsub = store.subscribe(() => {
      setCoins(store.getTotalCoins());
    });
    return unsub;
  }, []);

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">🏎️</span>
          <span className="nav-logo-text">HIGHWAY RUSH</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
            <span className="nav-link-icon">🎮</span>
            <span className="nav-link-label">PLAY</span>
          </Link>
          <Link to="/garage" className={`nav-link ${pathname === '/garage' ? 'active' : ''}`}>
            <span className="nav-link-icon">🚗</span>
            <span className="nav-link-label">GARAGE</span>
          </Link>
          <Link to="/leaderboard" className={`nav-link ${pathname === '/leaderboard' ? 'active' : ''}`}>
            <span className="nav-link-icon">🏆</span>
            <span className="nav-link-label">LEADERBOARD</span>
          </Link>
        </div>
        <div className="nav-coins-badge">
          <span className="coin-icon">🪙</span>
          <span className="coins-val">{coins}</span>
        </div>
      </div>
    </nav>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div id="app-root">
      <NavBar />
      <main className="app-main-content">
        <Outlet />
      </main>
    </div>
  );
}
