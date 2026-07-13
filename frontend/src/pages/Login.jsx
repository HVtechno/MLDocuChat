import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Logo } from "../components/ui/Logo";
import { Spinner } from "../components/ui/Spinner";

export function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError(null); setNotice(null); setBusy(true);
    // Normalize: iOS autofill can add whitespace/caps that trip strict
    // email validation ("string does not match the expected pattern").
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "login") {
        await login(cleanEmail, password);
        navigate("/chat");
      } else {
        const res = await signup(cleanEmail, password, nickname.trim());
        if (res.needs_confirmation) {
          setNotice(res.message);
          setMode("login");
        } else {
          await login(cleanEmail, password);
          navigate("/chat");
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold text-ink">Foliq</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
          <h1 className="font-display text-xl font-semibold text-ink mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-slate-500 mb-5">
            {mode === "login"
              ? "Log in to chat with your documents."
              : "Start chatting with your documents in minutes."}
          </p>

          <div className="space-y-3">
            {mode === "signup" && (
              <Input
                label="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="What should we call you?"
                autoComplete="nickname"
              />
            )}
            <Input
              label="Email"
              type="text"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-4 pr-11 py-2.5 text-[15px]
                    text-ink placeholder:text-slate-400 transition-colors
                    focus:border-iris focus:ring-2 focus:ring-iris/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {notice && <p className="text-sm text-emerald-700 mt-3">{notice}</p>}

          <Button
            onClick={submit}
            disabled={busy || !email || !password || (mode === "signup" && !nickname.trim())}
            size="lg"
            className="w-full mt-5"
          >
            {busy ? <Spinner /> : mode === "login" ? "Log in" : "Sign up"}
          </Button>

          <p className="text-sm text-slate-500 text-center mt-4">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              className="text-iris font-medium hover:underline"
            >
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
