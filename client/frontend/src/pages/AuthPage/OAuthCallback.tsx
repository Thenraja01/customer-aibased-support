import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, AlertCircle, Loader2, ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthAPI } from "@/api/auth.api";
import { useAuthContext } from "@/context/AuthContext";
import { useAppSettings } from "@/hooks/useAppSettings";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { provider: routeProvider } = useParams();
  const [params] = useSearchParams();
  const { setSession } = useAuthContext();
  const { settings: appSettings } = useAppSettings();
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  const navigateToDashboard = (role?: string) => {
    const r = (role || "").toLowerCase().replace(/[\s_]+/g, "_");
    if (r === "super_admin") navigate("/superadmin/dashboard", { replace: true });
    else if (r === "admin" || r === "branch_admin") navigate("/admin/dashboard", { replace: true });
    else if (r === "branch_admin") navigate("/branch/dashboard", { replace: true });
    else if (r === "support") navigate("/support/dashboard", { replace: true });
    else navigate("/dashboard", { replace: true });
  };

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const provider = (routeProvider || params.get("provider") || sessionStorage.getItem("oauth_provider") || "").toLowerCase();
    sessionStorage.removeItem("oauth_provider");
    const code = params.get("code");
    const state = params.get("state");
    const errorParam = params.get("error");
    const selfRedirectUri = `${window.location.origin}/oauth/${provider}/callback`;

    const run = async () => {
      if (errorParam) {
        setError(errorParam === "access_denied" ? "You declined the sign-in request." : errorParam);
        return;
      }
      if (!provider || !code) {
        setError("Missing OAuth parameters. Please try again.");
        return;
      }

      const expectedState = sessionStorage.getItem("oauth_state");
      if (!expectedState || expectedState !== state) {
        setError("Security check failed. Please try again.");
        return;
      }
      sessionStorage.removeItem("oauth_state");

      try {
        let res: any;
        if (provider === "google") {
          const verifier = sessionStorage.getItem("oauth_code_verifier");
          if (!verifier) {
            setError("Missing PKCE verifier. Please try again.");
            return;
          }
          sessionStorage.removeItem("oauth_code_verifier");
          res = await AuthAPI.googleCallback({ code, state, code_verifier: verifier, redirect_uri: selfRedirectUri });
        } else if (provider === "facebook") {
          res = await AuthAPI.facebookCallback({ code, state, redirect_uri: selfRedirectUri });
        } else {
          setError("Unsupported provider.");
          return;
        }

        const data = res?.data || {};

        if (data.token || data.accessToken) {
          if (!setSession(data)) {
            setError("Failed to save your session. Please try again.");
            return;
          }
          const normalized = data.user || data.data || {};
          const role =
            normalized.role ||
            normalized.roleName ||
            (Array.isArray(normalized.roles) && normalized.roles[0]) ||
            (typeof normalized.role_id === "object" ? normalized.role_id?.role_name : normalized.role_id) ||
            "";
          navigateToDashboard(role);
          return;
        }

        if (data.isNew && data.oauthToken) {
          const registerState = {
            oauthToken: data.oauthToken,
            oauthEmail: data.email,
            oauthName: data.name,
            oauthProvider: provider,
            oauthPicture: data.picture,
          };
          // Persist to sessionStorage so the completion step survives a hard
          // reload of /oauth/complete (React Router state is lost on reload).
          try {
            sessionStorage.setItem("oauth_register", JSON.stringify(registerState));
          } catch {}
          navigate("/oauth/complete", {
            replace: true,
            state: registerState,
          });
          return;
        }

        navigate("/registration-status", {
          replace: true,
          state: { email: data.email },
        });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Sign-in failed. Please try again.");
      }
    };

    run();
  }, [params, navigate, setSession]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5 flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md px-6 sm:px-10 py-8 dark:bg-card/80 dark:border-white/[0.06]">
            <CardContent className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                {error ? (
                  <AlertCircle className="w-8 h-8 text-primary-foreground" />
                ) : (
                  <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
                )}
              </div>

              <div>
                {appSettings?.logo?.url ? (
                  <img src={appSettings.logo.url} alt={appSettings.app_name || "Logo"} className="max-h-12 w-auto object-contain mx-auto mb-3" />
                ) : (
                  <Award className="w-10 h-10 mx-auto mb-3 text-primary" />
                )}
                <h2 className="text-xl font-bold">{error ? "Sign-in failed" : "Completing sign-in"}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || "Verifying your account, please wait..."}
                </p>
              </div>

              {error && (
                <div className="space-y-2">
                  <Button onClick={() => navigate("/login", { replace: true })} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/register", { replace: true })}
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create an Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
