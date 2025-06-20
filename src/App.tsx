import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard";
import Tasks from "./pages/Tasks/Tasks";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home"; // Importar o componente Home
import Navbar from "./components/Navbar/Navbar";
import { AuthProvider, useAuthContext } from "./hooks/AuthProvider";
import { TaskProvider } from "./hooks/TaskProvider"; // Importando o TaskProvider
import "./styles/global.css";
import Lumi from "./pages/Lumi/Lumi";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuthContext();

  return (
    <div className="app">
      {/* Mostrar Navbar apenas quando autenticado */}
      {isAuthenticated && <Navbar />}
      <div className="content">
        <Routes>
          {/* Rota Home - pública, sem autenticação necessária */}
          <Route path="/" element={<Home />} />

          {/* Acesso à página de login */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            }
          />

          {/* Redirecionar /app para dashboard (caso tenha links para /app) */}
          <Route
            path="/app"
            element={
              <Navigate
                to={isAuthenticated ? "/dashboard" : "/login"}
                replace
              />
            }
          />
          <Route
            path="/lumi"
            element={
              <PrivateRoute>
                <Lumi />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <AppRoutes />
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
