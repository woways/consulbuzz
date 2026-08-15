import { cloneElement, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ClientPortal from "./ClientPortal";
import ClientLogin from "./ClientLogin";
import AdminLogin from "./AdminLogin";
import SuperAdmin from "./SuperAdmin";
import { apiRequest } from "./lib/api";

function FullScreenMessage({ title, message }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="text-lg font-bold text-white">{title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-400">{message}</div>
      </div>
    </div>
  );
}

function ClientRoute({ children }) {
  const [status, setStatus] = useState("checking");
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function verifyClient() {
      try {
        const data = await apiRequest("/api/client/auth/me");
        if (active) {
          setSession(data);
          setStatus("authenticated");
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 503 && error?.data?.maintenance === true) {
          setMessage(error.data?.message || "ConsulBuzz is temporarily under maintenance.");
          setStatus("maintenance");
          return;
        }
        setSession(null);
        setStatus("unauthenticated");
      }
    }
    verifyClient();
    return () => { active = false; };
  }, []);

  if (status === "checking") return <FullScreenMessage title="ConsulBuzz" message="Verifying company session..." />;
  if (status === "maintenance") return <FullScreenMessage title="Scheduled Maintenance" message={message} />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return cloneElement(children, { clientSession: session });
}

function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;
    async function verifyAdmin() {
      try {
        await apiRequest("/api/admin/auth/me");
        if (active) setStatus("authenticated");
      } catch {
        if (active) setStatus("unauthenticated");
      }
    }
    verifyAdmin();
    return () => { active = false; };
  }, []);

  if (status === "checking") return <FullScreenMessage title="ConsulBuzz" message="Verifying administrator session..." />;
  if (status === "unauthenticated") return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/" element={<ClientRoute><ClientPortal /></ClientRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><SuperAdmin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
