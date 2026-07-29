import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ProtectedRoute from "./ProtectedRoute";

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Upload = lazy(() => import("../pages/Upload/Upload"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const Forecast = lazy(() => import("../pages/Forecast/Forecast"));

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading page…</div>}>
    <Routes>
      {/* Redirect Root */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forecast"
        element={
          <ProtectedRoute>
            <Forecast />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Unknown Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;
