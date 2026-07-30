import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

function Register() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, { fullName: form.fullName, email: form.email });
      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15">
              <BarChart3 />
            </span>
            <b>Aperture Analytics</b>
          </div>
          <p className="mt-28 max-w-md text-4xl font-bold leading-tight">
            Build a more informed business.
          </p>
          <p className="mt-5 max-w-md leading-7 text-blue-100">
            A focused command center for your revenue, customers, and momentum.
          </p>
        </div>
      </aside>
      <main className="auth-form">
        <div className="w-full max-w-sm">
          <p className="text-sm font-semibold text-blue-600">GET STARTED</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Create your workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Start exploring your business with clarity.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {[
              ["fullName", "Full name", "Your full name", "text"],
              ["email", "Email address", "you@company.com", "email"],
              ["password", "Password", "At least 8 characters", "password"],
            ].map(([key, label, placeholder, type]) => (
              <label key={key} className="block text-sm font-semibold">
                {label}
                <input
                  required
                  minLength={key === "password" ? 8 : undefined}
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="form-input mt-2 font-normal"
                  placeholder={placeholder}
                />
              </label>
            ))}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white"
            >
              {loading ? "Creating workspace…" : "Create account"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="font-semibold text-blue-600" to="/login">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;
