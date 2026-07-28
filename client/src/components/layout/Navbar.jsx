import { FaBell, FaUserCircle } from "react-icons/fa";

function Navbar() {
  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-8">

      <h1 className="text-2xl font-bold text-gray-700">
        Business Analytics Dashboard
      </h1>

      <div className="flex items-center gap-6">

        <FaBell size={22} className="cursor-pointer text-gray-600" />

        <div className="flex items-center gap-2">

          <FaUserCircle size={35} />

          <span className="font-medium">
            Admin
          </span>

        </div>

      </div>

    </div>
  );
}

export default Navbar;