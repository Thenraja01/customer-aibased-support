import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAPI } from "@/api/auth.api";
import { generateCodeVerifier, generateCodeChallenge } from "@/utils/oauth";

const callbackUri = (provider: string) => `${window.location.origin}/oauth/${provider}/callback`;

export default function OAuthButtons() {
  const [providers, setProviders] = useState<{ google: boolean; facebook: boolean } | null>(null);
  const [loading, setLoading] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AuthAPI.getOAuthProviders()
      .then((res: any) => setProviders(res?.data?.data || null))
      .catch(() => setProviders({ google: false, facebook: false }));
  }, []);

  const hasAny = providers?.google || providers?.facebook;

  const handleGoogle = async () => {
    if (loading) return;
    setLoading("google");
    setError(null);
    try {
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      const res: any = await AuthAPI.getGoogleAuthUrl({ code_challenge: challenge, redirect_uri: callbackUri("google") });
      const { url, state } = res?.data?.data || {};
      if (!url || !state) {
        throw new Error("Could not build Google sign-in URL");
      }
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_code_verifier", verifier);
      sessionStorage.setItem("oauth_provider", "google");
      window.location.assign(url);
    } catch (err: any) {
      console.error("Google OAuth failed:", err);
      setError(err?.response?.data?.message || "Google sign-in is unavailable. Please try again.");
      setLoading(null);
    }
  };

  const handleFacebook = async () => {
    if (loading) return;
    setLoading("facebook");
    setError(null);
    try {
      const res: any = await AuthAPI.getFacebookAuthUrl({ redirect_uri: callbackUri("facebook") });
      const { url, state } = res?.data?.data || {};
      if (!url || !state) {
        throw new Error("Could not build Facebook sign-in URL");
      }
      sessionStorage.setItem("oauth_state", state);
      sessionStorage.setItem("oauth_provider", "facebook");
      window.location.assign(url);
    } catch (err: any) {
      console.error("Facebook OAuth failed:", err);
      setError(err?.response?.data?.message || "Facebook sign-in is unavailable. Please try again.");
      setLoading(null);
    }
  };

  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t dark:border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card dark:bg-card/80 px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.google && (
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading !== null}
            className="w-full h-11 dark:border-white/[0.08]"
          >
            {loading === "google" ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
            )}
            Continue with Google
          </Button>
        )}

        {providers.facebook && (
          <Button
            type="button"
            variant="outline"
            onClick={handleFacebook}
            disabled={loading !== null}
            className="w-full h-11 dark:border-white/[0.08]"
          >
            {loading === "facebook" ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            Continue with Facebook
          </Button>
        )}
      </div>

      {error && (
        <p className="text-center text-xs text-destructive" role="alert">{error}</p>
      )}
    </div>
  );
}
