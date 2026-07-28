import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function DashboardLayout({ children }) {
  return (
    <div className="flex">

      <Sidebar />

      <div className="ml-64 flex-1 bg-gray-100 min-h-screen">

        <Navbar />

        <div className="p-8">
          {children}
        </div>

      </div>

    </div>
  );
}

export default DashboardLayout;