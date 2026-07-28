import DashboardLayout from "../../components/layout/DashboardLayout";

function Dashboard() {
  return (
    <DashboardLayout>

      <h1 className="text-4xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Revenue</h2>
          <p className="text-3xl font-bold mt-3">₹1,24,500</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Orders</h2>
          <p className="text-3xl font-bold mt-3">1,254</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Customers</h2>
          <p className="text-3xl font-bold mt-3">645</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-500">Growth</h2>
          <p className="text-3xl font-bold mt-3 text-green-600">
            +18%
          </p>
        </div>

      </div>

    </DashboardLayout>
  );
}

export default Dashboard;