import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { LoadingState } from "./components/common/LoadingState";

const HomePage = lazy(() => import("./pages/HomePage").then((module) => ({ default: module.HomePage })));
const AgentMapPage = lazy(() =>
  import("./pages/AgentMapPage").then((module) => ({ default: module.AgentMapPage }))
);
const DashboardPage = lazy(() =>
  import("./components/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage
  }))
);
const FacilitiesPage = lazy(() =>
  import("./components/facilities/FacilitiesPage").then((module) => ({
    default: module.FacilitiesPage
  }))
);
const ImpactPage = lazy(() =>
  import("./components/impact/ImpactPage").then((module) => ({ default: module.ImpactPage }))
);
const SearchPage = lazy(() =>
  import("./components/search/SearchPage").then((module) => ({ default: module.SearchPage }))
);
const MapPage = lazy(() =>
  import("./pages/MapPage").then((module) => ({ default: module.MapPage }))
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage }))
);

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Loading page..." />}>
        <Routes>
          <Route path="/" element={<AgentMapPage />} />
          <Route path="/overview" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/facilities" element={<FacilitiesPage />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/agent" element={<AgentMapPage />} />
          <Route path="/home" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
