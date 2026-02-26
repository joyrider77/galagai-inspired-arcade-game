import React from 'react';
import { createRouter, createRoute, createRootRoute, RouterProvider, Outlet } from '@tanstack/react-router';
import GalagaGameWrapper from './components/GalagaGameWrapper';
import FeaturesPage from './components/FeaturesPage';
import LeaderboardPage from './components/LeaderboardPage';
import AchievementsPage from './components/AchievementsPage';
import DesignsPage from './components/DesignsPage';
import { AuthGuard } from './components/AuthGuard';

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <AuthGuard>
      <GalagaGameWrapper />
    </AuthGuard>
  ),
});

const featuresRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/features',
  component: FeaturesPage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: LeaderboardPage,
});

const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/achievements',
  component: AchievementsPage,
});

const designsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/designs',
  component: DesignsPage,
});

const routeTree = rootRoute.addChildren([indexRoute, featuresRoute, leaderboardRoute, achievementsRoute, designsRoute]);

const router = createRouter({ routeTree });

function App() {
  return <RouterProvider router={router} />;
}

export default App;
