import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Dashboard from "./pages/Dashboard/Dashboard";
import Tasks from "./pages/Tasks/Tasks";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home"; // Importar o componente Home
import Navbar from "./components/Navbar/Navbar";
import authService from "./services/authService";
import { TaskProvider } from "./hooks/TaskProvider"; // Importando o TaskProvider
import "./styles/global.css";
import Lumi from "./pages/Lumi/Lumi";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <TaskProvider>
          <div className="app">
            {/* Mostrar Navbar apenas quando autenticado e não estiver na página home */}
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
                />                <Route
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
        </TaskProvider>
      </Router>
    </DndProvider>
  );
}

export default App;
