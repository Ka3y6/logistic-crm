import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { EmailProvider } from './contexts/EmailContext';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OrdersPage from './pages/OrdersPage';
import ClientsPage from './pages/ClientsPage';
import CarriersPage from './pages/CarriersPage';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';
import ProfilePage from './pages/ProfilePage';
import Unauthorized from './pages/Unauthorized';
import AdminPanel from './pages/Dashboard/AdminPanel';
import ManagerPanel from './pages/Dashboard/ManagerPanel';
import ClientPanel from './pages/Dashboard/ClientPanel';
import Calendar from './components/apps/calendar/Calendar';
import Chat from './components/apps/chat/Chat';
import Email from './components/apps/email/Email';
import ClientForm from './components/clients/ClientForm';
import OrderForm from './components/orders/OrderForm';
import { CustomThemeProvider } from './contexts/ThemeContext';
import SettingsPage from './pages/SettingsPage';
import AIAssistantChat from './components/AIAssistantChat';
import './App.css';

const DashboardRoute = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role?.toLowerCase()) {
    case 'admin':
      return <Layout><AdminPanel /></Layout>;
    case 'manager':
      return <Layout><ManagerPanel /></Layout>;
    case 'client':
      return <Layout><ClientPanel /></Layout>;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <CustomThemeProvider>
                    <EmailProvider>
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <PublicRoute>
                                        <Navigate to="/login" replace />
                                    </PublicRoute>
                                }
                            />
                            <Route
                                path="/login"
                                element={
                                    <PublicRoute>
                                        <Login />
                                    </PublicRoute>
                                }
                            />
                            <Route
                                path="/register"
                                element={
                                    <PublicRoute>
                                        <SignUp />
                                    </PublicRoute>
                                }
                            />
                            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                            <Route path="/unauthorized" element={<Unauthorized />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager', 'client']}>
                                        <DashboardRoute />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/dashboard/manager"
                                element={
                                    <PrivateRoute allowedRoles={['manager']}>
                                        <Layout>
                                            <ManagerPanel />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/dashboard/client"
                                element={
                                    <PrivateRoute allowedRoles={['client']}>
                                        <Layout>
                                            <ClientPanel />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager', 'client']}>
                                        <Layout>
                                            <ProfilePage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/orders"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <OrdersPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/orders/new"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <OrderForm />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/orders/:id/edit"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <OrderForm />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/clients"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <ClientsPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/clients/:id/edit"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <ClientForm />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/carriers"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <CarriersPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/calendar"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager', 'client']}>
                                        <Layout>
                                            <Calendar />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/chat"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager', 'client']}>
                                        <Layout>
                                            <Chat />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/email"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager']}>
                                        <Layout>
                                            <Email />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <PrivateRoute allowedRoles={['admin', 'manager', 'client']}>
                                        <Layout>
                                            <SettingsPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                        <AIAssistantChat />
                    </EmailProvider>
                </CustomThemeProvider>
            </AuthProvider>
        </Router>
    );
}

export default App; 