import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Dashboard from './pages/Dashboard/Dashboard';
import Tasks from './pages/Tasks/Tasks';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Navbar from './components/Navbar/Navbar';
import authService from './services/authService';
import './styles/global.css';

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
        <div className="app">
          {isAuthenticated && <Navbar />}
          <div className="content">
            <Routes>
              <Route path="/login" element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } />
              <Route path="/register" element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
              } />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/tasks" element={
                <PrivateRoute>
                  <Tasks />
                </PrivateRoute>
              } />
              <Route path="/" element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              } />
            </Routes>
          </div>
        </div>
      </Router>
    </DndProvider>
  );
}

export default App;