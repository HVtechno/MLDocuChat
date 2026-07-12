import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Chat } from "./pages/Chat";
import { Pricing } from "./pages/Pricing";
import { PrivacyPage, CookiePage } from "./pages/Legal";
import { AdminPanel } from "./pages/AdminPanel";
import { CookieConsent } from "./components/CookieConsent";
import { Spinner } from "./components/ui/Spinner";

// Full-screen loading state while we check the stored session.
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-surface-dark">
      <Spinner className="w-6 h-6 text-iris" />
    </div>
  );
}

// Protects app routes: logged-out users go to /login.
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
}

// The root route. A logged-in user is sent straight to their workspace
// and stays there until they log out or their session truly expires —
// they never get bounced back to the marketing page. Visitors who aren't
// logged in see the landing page.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/chat" replace /> : <Landing />;
}

// Keeps logged-in users out of the login page too — if they're already
// authenticated and hit /login, send them to the app.
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? <Navigate to="/chat" replace /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookies" element={<CookiePage />} />
            <Route path="/chat" element={<Protected><Chat /></Protected>} />
            <Route path="/chat/:chatId" element={<Protected><Chat /></Protected>} />
            <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
