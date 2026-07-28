import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../common/cn";

function LogoutButton({ collapsed = false, className = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You'll need to sign back in to access your dashboard.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="Sign out"
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "text-muted transition-colors hover:bg-danger-soft hover:text-danger",
        collapsed && "justify-center",
        className
      )}
    >
      <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {!collapsed && <span>Sign out</span>}
    </button>
  );
}

export default LogoutButton;
