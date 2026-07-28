import DashboardLayout from "../../components/layout/DashboardLayout";

function Dashboard() {
  return (
    <DashboardLayout>

      <h1 className="text-3xl font-bold text-gray-800">
        Dashboard
      </h1>

      <p className="text-gray-500 mt-2">
        Welcome to your Business Analytics Dashboard.
      </p>

    </DashboardLayout>
  );
}

export default Dashboard;