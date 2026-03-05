import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import PacienteDetalhes from './pages/PacienteDetalhes';
import Dentistas from './pages/Dentistas';
import Agendamentos from './pages/Agendamentos';
import Procedimentos from './pages/Procedimentos';
import Faturamentos from './pages/Faturamentos';
import FinGlobalDashboard from './pages/FinGlobalDashboard';
import Usuarios from './pages/Usuarios';
import { useAuthSession } from './hooks/useAuthSession';

// Mock Auth Guard
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedInfo = JSON.parse(atob(base64));
    if (decodedInfo.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  } catch (e) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Layout shell component for authenticated routes
const Shell = ({ children }) => {
  useAuthSession(); // Ativa as regras de inatividade e expiração absoluta para usuários logados

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-teal-500/30">
      <Sidebar />
      <main className="flex-1 p-3 md:p-5 overflow-y-auto overflow-x-hidden h-screen relative">
        {/* Subtle global gradient background for the main content area */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-400/5 dark:bg-teal-900/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />

        {/* Authenticated Routes wrapped in the Shell Layout */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Shell><Dashboard /></Shell>
          </PrivateRoute>
        } />

        {/* Placeholders for remaining routes */}
        <Route path="/pacientes" element={<PrivateRoute><Shell><Pacientes /></Shell></PrivateRoute>} />
        <Route path="/pacientes/:id" element={<PrivateRoute><Shell><PacienteDetalhes /></Shell></PrivateRoute>} />
        <Route path="/dentistas" element={<PrivateRoute><Shell><Dentistas /></Shell></PrivateRoute>} />
        <Route path="/agendamentos" element={<PrivateRoute><Shell><Agendamentos /></Shell></PrivateRoute>} />
        <Route path="/procedimentos" element={<PrivateRoute><Shell><Procedimentos /></Shell></PrivateRoute>} />
        <Route path="/faturamentos" element={<PrivateRoute><Shell><Faturamentos /></Shell></PrivateRoute>} />
        <Route path="/financeiro" element={<PrivateRoute><Shell><FinGlobalDashboard /></Shell></PrivateRoute>} />
        <Route path="/usuarios" element={<AdminRoute><Shell><Usuarios /></Shell></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
