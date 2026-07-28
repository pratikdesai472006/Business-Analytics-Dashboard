import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Upload from "../pages/Upload/Upload";
import Reports from "../pages/Reports/Reports";
import Profile from "../pages/Profile/Profile";
import Forecast from "../pages/Forecast/Forecast";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/forecast" element={<Forecast />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default AppRoutes;