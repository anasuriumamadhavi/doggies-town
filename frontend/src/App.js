import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import { SiteProvider } from "./context/SiteContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import { PublicLayout } from "./components/public/PublicLayout";
import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Services from "./pages/public/Services";
import ServiceDetail from "./pages/public/ServiceDetail";
import Packages from "./pages/public/Packages";
import PackageDetail from "./pages/public/PackageDetail";
import Gallery from "./pages/public/Gallery";
import Contact from "./pages/public/Contact";
import FAQ from "./pages/public/FAQ";

import AdminLogin from "./pages/admin/AdminLogin";
import { AdminLayout } from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import ResourcePage from "./pages/admin/ResourcePage";
import Enquiries from "./pages/admin/Enquiries";
import WhatsAppLogs from "./pages/admin/WhatsAppLogs";
import ActivityLogs from "./pages/admin/ActivityLogs";
import Media from "./pages/admin/Media";
import SettingsPage from "./pages/admin/SettingsPage";
import HomepageEditor from "./pages/admin/HomepageEditor";
import AboutEditor from "./pages/admin/AboutEditor";

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="flex h-screen items-center justify-center text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <SiteProvider>
            <Routes>
              {/* Public */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/packages" element={<Packages />} />
                <Route path="/packages/:slug" element={<PackageDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
              </Route>

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="homepage" element={<HomepageEditor />} />
                <Route path="about" element={<AboutEditor />} />
                <Route path="services" element={<ResourcePage resource="services" />} />
                <Route path="packages" element={<ResourcePage resource="packages" />} />
                <Route path="gallery" element={<ResourcePage resource="gallery" />} />
                <Route path="testimonials" element={<ResourcePage resource="testimonials" />} />
                <Route path="faqs" element={<ResourcePage resource="faqs" />} />
                <Route path="navigation" element={<ResourcePage resource="navigation" />} />
                <Route path="enquiries" element={<Enquiries />} />
                <Route path="media" element={<Media />} />
                <Route path="contact-settings" element={<SettingsPage tab="contact" />} />
                <Route path="whatsapp-settings" element={<SettingsPage tab="whatsapp" />} />
                <Route path="cta-settings" element={<SettingsPage tab="cta" />} />
                <Route path="seo" element={<SettingsPage tab="seo" />} />
                <Route path="whatsapp-logs" element={<WhatsAppLogs />} />
                <Route path="activity-logs" element={<ActivityLogs />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SiteProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
