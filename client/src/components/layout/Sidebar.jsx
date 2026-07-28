import { NavLink } from "react-router-dom";
import {
  FaChartLine,
  FaUpload,
  FaChartBar,
  FaFileAlt,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: <FaChartLine /> },
  { name: "Upload CSV", path: "/upload", icon: <FaUpload /> },
  { name: "Reports", path: "/reports", icon: <FaChartBar /> },
  { name: "Forecast", path: "/forecast", icon: <FaFileAlt /> },
  { name: "Profile", path: "/profile", icon: <FaUser /> },
];

function Sidebar() {
  return (
    <div className="w-64 h-screen bg-blue-700 text-white fixed">

      <div className="text-2xl font-bold p-6 border-b border-blue-500">
        Analytics
      </div>

      <div className="mt-5">

        {menu.map((item) => (

          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-4 hover:bg-blue-600 transition ${
                isActive ? "bg-blue-500" : ""
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>

        ))}

      </div>

      <div className="absolute bottom-0 w-full">

        <button className="flex items-center gap-3 w-full px-6 py-4 hover:bg-red-600 transition">

          <FaSignOutAlt />
          Logout

        </button>

      </div>

    </div>
  );
}

export default Sidebar;