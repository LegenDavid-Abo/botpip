
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";

import FirmLayout from "./components/FirmLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import PlaygroundLayout from "./components/PlaygroundLayout.jsx";

import FirmDashboard from "./pages/firm/Dashboard.jsx";
import KnowledgeBase from "./pages/firm/KnowledgeBase.jsx";
import Integrations from "./pages/firm/Integrations.jsx";
import ChannelSelector from "./pages/firm/ChannelSelector.jsx";
import WidgetPreview from "./pages/firm/WidgetPreview.jsx";
import AIBehaviour from "./pages/firm/AIBehaviour.jsx";
import ResponseFlow from "./pages/firm/ResponseFlow.jsx";
import StyleEmoji from "./pages/firm/StyleEmoji.jsx";
import LotCalculator from "./pages/firm/LotCalculator.jsx";
import ReplyTemplates from "./pages/firm/ReplyTemplates.jsx";
import EscalationInbox from "./pages/firm/EscalationInbox.jsx";
import AutoFAQ from "./pages/firm/AutoFAQ.jsx";
import SendMessage from "./pages/firm/SendMessage.jsx";
import ScheduledMessages from "./pages/firm/ScheduledMessages.jsx";
import ContactSupport from "./pages/firm/ContactSupport.jsx";
import Analytics from "./pages/firm/Analytics.jsx";
import Conversations from "./pages/firm/Conversations.jsx";
import ExportData from "./pages/firm/ExportData.jsx";
import NotificationSettings from "./pages/firm/NotificationSettings.jsx";
import Subscription from "./pages/firm/Subscription.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminFirms from "./pages/admin/Firms.jsx";
import AdminInbox from "./pages/admin/Inbox.jsx";
import AdminOnboarding from "./pages/admin/Onboarding.jsx";
import AdminPlans from "./pages/admin/Plans.jsx";
import AdminCoupons from "./pages/admin/Coupons.jsx";
import AdminBilling from "./pages/admin/Billing.jsx";
import AdminReferral from "./pages/admin/Referral.jsx";
import AdminForecast from "./pages/admin/Forecast.jsx";
import AdminROI from "./pages/admin/ROI.jsx";
import AdminBroadcast from "./pages/admin/Broadcast.jsx";
import AdminEmails from "./pages/admin/Emails.jsx";
import AdminChangelog from "./pages/admin/Changelog.jsx";
import AdminUptime from "./pages/admin/Uptime.jsx";
import AdminUsage from "./pages/admin/Usage.jsx";
import AdminBranding from "./pages/admin/Branding.jsx";
import AdminAPIs from "./pages/admin/APIs.jsx";
import AdminSettings from "./pages/admin/Settings.jsx";

import PlaygroundChat from "./pages/playground/Chat.jsx";
import PlaygroundMulti from "./pages/playground/Multi.jsx";
import PlaygroundSpeed from "./pages/playground/Speed.jsx";
import PlaygroundScreenshot from "./pages/playground/Screenshot.jsx";
import PlaygroundQuiz from "./pages/playground/Quiz.jsx";
import PlaygroundHealth from "./pages/playground/Health.jsx";
import PlaygroundInterview from "./pages/playground/Interview.jsx";
import PlaygroundGaps from "./pages/playground/Gaps.jsx";
import PlaygroundConflicts from "./pages/playground/Conflicts.jsx";

// ── PrivateRoute: guards by role, redirects correctly ─────────────────────
function PrivateRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <div className="spinner" style={{width:28,height:28}} />
      <span style={{color:"var(--text2)",fontSize:12}}>Loading...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    // Wrong role — send them to the right place
    return <Navigate to={role === "superadmin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

// ── SmartRedirect: sends logged-in users to correct dashboard ─────────────
function SmartRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "superadmin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Firm dashboard */}
      <Route path="/dashboard" element={<PrivateRoute requiredRole="firm"><FirmLayout /></PrivateRoute>}>
        <Route index element={<FirmDashboard />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="channels" element={<ChannelSelector />} />
        <Route path="widget" element={<WidgetPreview />} />
        <Route path="ai" element={<AIBehaviour />} />
        <Route path="flow" element={<ResponseFlow />} />
        <Route path="style" element={<StyleEmoji />} />
        <Route path="calculator" element={<LotCalculator />} />
        <Route path="templates" element={<ReplyTemplates />} />
        <Route path="escalations" element={<EscalationInbox />} />
        <Route path="faq" element={<AutoFAQ />} />
        <Route path="send" element={<SendMessage />} />
        <Route path="scheduled" element={<ScheduledMessages />} />
        <Route path="contact" element={<ContactSupport />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="export" element={<ExportData />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="subscription" element={<Subscription />} />
      </Route>

      {/* Playground — also gated by firm role */}
      <Route path="/playground" element={<PrivateRoute requiredRole="firm"><PlaygroundLayout /></PrivateRoute>}>
        <Route index element={<PlaygroundChat />} />
        <Route path="multi" element={<PlaygroundMulti />} />
        <Route path="speed" element={<PlaygroundSpeed />} />
        <Route path="screenshot" element={<PlaygroundScreenshot />} />
        <Route path="quiz" element={<PlaygroundQuiz />} />
        <Route path="health" element={<PlaygroundHealth />} />
        <Route path="interview" element={<PlaygroundInterview />} />
        <Route path="gaps" element={<PlaygroundGaps />} />
        <Route path="conflicts" element={<PlaygroundConflicts />} />
      </Route>

      {/* Super admin */}
      <Route path="/admin" element={<PrivateRoute requiredRole="superadmin"><AdminLayout /></PrivateRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="firms" element={<AdminFirms />} />
        <Route path="inbox" element={<AdminInbox />} />
        <Route path="onboarding" element={<AdminOnboarding />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="referral" element={<AdminReferral />} />
        <Route path="forecast" element={<AdminForecast />} />
        <Route path="roi" element={<AdminROI />} />
        <Route path="broadcast" element={<AdminBroadcast />} />
        <Route path="emails" element={<AdminEmails />} />
        <Route path="changelog" element={<AdminChangelog />} />
        <Route path="uptime" element={<AdminUptime />} />
        <Route path="usage" element={<AdminUsage />} />
        <Route path="branding" element={<AdminBranding />} />
        <Route path="apis" element={<AdminAPIs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Root: smart redirect based on role */}
      <Route path="/" element={<SmartRedirect />} />
      <Route path="*" element={<SmartRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
