import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle, Loader2, UserCircle, ArrowRight, Mail, Phone,
  LogIn,
} from "lucide-react";import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAPI } from "@/api/auth.api";
import { useAppSettings } from "@/hooks/useAppSettings";
import { generateCodeVerifier, generateCodeChallenge } from "@/utils/oauth";

interface OAuthState {
  oauthToken: string;
  oauthEmail: string;
  oauthName: string;
  oauthProvider: string;
  oauthPicture?: string;
}

interface OrgOption { _id: string; name: string; organization_id: string }
interface RoleOption { _id: string; role_name: string; description?: string }

const STORAGE_KEY = "oauth_register";

function loadOAuthState(routerState: any): OAuthState | null {
  const fromLocation = routerState && routerState.oauthToken ? (routerState as OAuthState) : null;
  if (fromLocation) return fromLocation;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as OAuthState;
  } catch {}
  return null;
}

export default function OAuthCompletion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings: appSettings } = useAppSettings();

  const [identity, setIdentity] = useState<OAuthState | null>(null);
  const [phone, setPhone] = useState("");
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [orgQuery, setOrgQuery] = useState("");

  const [orgsLoading, setOrgsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [grantExpired, setGrantExpired] = useState(false);

  const completedRef = useRef(false);
  const providerLabel = (identity?.oauthProvider || "google") === "facebook" ? "Facebook" : "Google";

  // Seed identity from router state (fallback to sessionStorage for hard reloads).
  const seeded = loadOAuthState(location.state as any);

  useEffect(() => {
    if (!seeded?.oauthToken) {
      // Nothing to complete — back to login.
      const t = setTimeout(() => navigate("/login", { replace: true }), 1500);
      return () => clearTimeout(t);
    }
    setIdentity(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded?.oauthToken]);

  // Load organizations (public, pre-auth).
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setOrgsLoading(true);
      try {
        const res: any = await AuthAPI.getOrganizations();
        const orgs = res?.data?.data || [];
        if (mounted) setOrganizations(orgs);
      } catch {
        if (mounted) setOrganizations([]);
      } finally {
        if (mounted) setOrgsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const DEFAULT_FALLBACK_ROLES = [
    { _id: "customer", role_name: "customer", description: "Customer / End User" },
    { _id: "support", role_name: "support", description: "Customer Support Agent" },
  ];

  // Load requestable roles for the selected organization.
  useEffect(() => {
    if (!selectedOrg) {
      setRoles([]);
      return;
    }
    let mounted = true;
    setRolesLoading(true);
    setRoles([]);
    setSelectedRole("");
    const load = async () => {
      try {
        const res: any = await AuthAPI.getRequestableRoles(selectedOrg);
        const data = res?.data?.data;
        if (mounted) setRoles(Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_ROLES);
      } catch {
        // Fall back to the legacy global roles endpoint if the org-scoped one fails.
        try {
          const res: any = await AuthAPI.getRoles();
          const data = res?.data?.data;
          if (mounted) setRoles(Array.isArray(data) && data.length > 0 ? data : DEFAULT_FALLBACK_ROLES);
        } catch {
          if (mounted) setRoles(DEFAULT_FALLBACK_ROLES);
        }
      } finally {
        if (mounted) setRolesLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [selectedOrg]);

  const filteredOrgs = orgQuery
    ? organizations.filter((o) => (o?.name || "").toLowerCase().includes(orgQuery.toLowerCase()))
    : organizations;

  const handleSubmit = useCallback(async () => {
    if (!identity?.oauthToken) return;
    if (!selectedOrg || !selectedRole) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await AuthAPI.completeOAuthRegistration({
        oauthToken: identity.oauthToken,
        organization_id: selectedOrg,
        requested_role: selectedRole,
      });

      // Registration submitted pending admin approval. Navigate to the
      // pending-status screen so the user can track approval.
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      if (!completedRef.current) {
        completedRef.current = true;
        navigate("/registration-status", {
          replace: true,
          state: { email: identity.oauthEmail },
        });
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || "Registration failed";
      // The OAuth grant is short-lived. If it expired, offer to sign in again.
      if (status === 400 && /expired|token|invalid/i.test(message)) {
        setGrantExpired(true);
        setSubmitError("Your sign-in session expired. Please sign in again to continue.");
      } else {
        setGrantExpired(false);
        setSubmitError(message);
      }
    } finally {
      if (!completedRef.current) setSubmitting(false);
    }
  }, [identity, selectedOrg, selectedRole, navigate]);

  const restartGoogleSignup = useCallback(async () => {
    try {
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      sessionStorage.setItem("oauth_code_verifier", verifier);
      sessionStorage.setItem("oauth_provider", "google");
      const res: any = await AuthAPI.getGoogleAuthUrl({
        code_challenge: challenge,
        redirect_uri: `${window.location.origin}/oauth/google/callback`,
      });
      const { url, state } = res?.data?.data || {};
      if (!url || !state) throw new Error("Could not build Google sign-in URL");
      sessionStorage.setItem("oauth_state", state);
      window.location.assign(url);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Unable to restart Google sign-in.");
    }
  }, []);

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted dark:from-background dark:via-background dark:to-primary/5 flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-2xl bg-card/95 backdrop-blur-md dark:bg-card/80 dark:border-white/[0.06]">
            <CardHeader className="text-center space-y-3 pb-6 px-8 pt-10">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                {identity.oauthPicture ? (
                  <img src={identity.oauthPicture} alt={providerLabel} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-8 h-8 text-primary-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold">Complete your sign-in</CardTitle>
                <CardDescription>
                  {appSettings?.app_name
                    ? `Welcome to ${appSettings.app_name}`
                    : "Confirm your details to finish signing in with " + providerLabel + "."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10 space-y-6">
              {/* Identity banner (read-only OAuth attributes) */}
              <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 dark:border-primary/10 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase  text-muted-foreground">Identity verified via {providerLabel}</p>
                  <p className="text-base font-semibold text-foreground truncate">{identity.oauthName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{identity.oauthEmail}</span>
                  </div>
                </div>
              </div>

              {/* Phone (optional, editable; not persisted by the OAuth completion endpoint) */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Organization selector with live search */}
              <div className="space-y-1.5">
                <Label htmlFor="org-search">Organization</Label>
                <Input
                  id="org-search"
                  placeholder="Search organizations..."
                  value={orgQuery}
                  onChange={(e) => setOrgQuery(e.target.value)}
                  className="h-10"
                  disabled={orgsLoading || submitting}
                />
                {orgsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading organizations...
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border rounded-md bg-popover">
                    {filteredOrgs.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">No organizations found</p>
                    ) : (
                      filteredOrgs.map((o) => (
                        <button
                          type="button"
                          key={o._id}
                          onClick={() => setSelectedOrg(o._id)}
                          className={`w-full text-left px-3 py-2 flex flex-col focus:outline-none focus:bg-accent ${
                            selectedOrg === o._id
                              ? "bg-primary/10 border-l-2 border-primary"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <span className="font-medium text-sm text-foreground">{o.name}</span>
                          <span className="text-xs text-muted-foreground">ID: {o.organization_id}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Role selector (scoped to the chosen organization) */}
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={!selectedOrg || rolesLoading || submitting}
                  className="w-full h-11 px-3 rounded-md border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>{!selectedOrg ? "Select an organization" : rolesLoading ? "Loading roles..." : "Select a role"}</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.role_name}
                      {r.description ? ` — ${r.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {submitError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 space-y-2 text-sm text-destructive" role="alert">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                  {submitError.toLowerCase().includes("already exists") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/login", { state: { email: identity?.oauthEmail } })}
                      className="w-full mt-2 border-destructive/40 hover:bg-destructive/20 text-destructive font-medium"
                    >
                      <LogIn className="mr-2 h-3.5 w-3.5" />
                      Sign In to Your Existing Account
                    </Button>
                  )}
                </div>
              )}

              {grantExpired ? (
                <Button
                  type="button"
                  onClick={restartGoogleSignup}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in with Google again
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || !selectedOrg || !selectedRole}
                  className="w-full h-11 bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-primary/90 hover:via-primary/80 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 size={18} className="mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><ArrowRight className="mr-2 h-4 w-4" /> Submit Registration</>
                  )}
                </Button>
              )}

              <p className="text-center text-xs text-muted-foreground">
                A pending registration will be created and an administrator will review your request.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
