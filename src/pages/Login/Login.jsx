import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../services/authService";

function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      login(data.token, data.user);
      nav("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15">
              <BarChart3 />
            </span>
            <b>Aperture Analytics</b>
          </div>
          <p className="mt-28 text-4xl font-bold leading-tight">
            Every decision deserves a clearer view.
          </p>
          <p className="mt-5 leading-7 text-blue-100">
            Understand performance, uncover growth opportunities, and turn
            business data into momentum.
          </p>
          <div className="mt-14 rounded-2xl border border-white/15 bg-white/10 p-5">
            <p className="text-sm">
              “A refreshingly focused way to see our business.”
            </p>
            <p className="mt-3 text-xs font-bold text-blue-100">
              — Pratik Desai, Operations lead
            </p>
          </div>
        </div>
      </aside>
      <main className="auth-form">
        <div className="w-full max-w-sm">
          <div className="md:hidden flex items-center gap-2 mb-10 text-blue-600">
            <BarChart3 />
            <b>Aperture Analytics</b>
          </div>
          <p className="text-sm font-semibold text-blue-600">WELCOME BACK</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter your details to access your analytics.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold">
              Email address
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="form-input mt-2 font-normal"
                placeholder="you@company.com"
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="form-input mt-2 font-normal"
                placeholder="Enter your password"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 disabled:opacity-60"
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Sign in <ArrowRight className="inline ml-1" size={16} />
                </>
              )}
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            New to Aperture?{" "}
            <Link className="font-semibold text-blue-600" to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
