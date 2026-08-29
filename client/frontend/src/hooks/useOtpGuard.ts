import { useState, useEffect, useCallback, useRef } from "react";
import { AuthAPI } from "@/api/auth.api";

/**
 * Drives the OTP resend countdown / lockout UX from the server-side guard state
 * (GET /auth/v1/otp-status/:email). The server is the source of truth so the
 * timer survives refreshes and matches backend enforcement exactly.
 *
 * Returns:
 *  - resendIn:     seconds until the user may request another OTP (0 = allowed)
 *  - locked:       whether the OTP is currently in a lockout window
 *  - lockedIn:     seconds remaining in the lockout window
 *  - attemptsLeft: failed verify attempts remaining before lockout
 *  - hasActiveOtp: whether a valid unexpired OTP exists for the email
 *  - expiresIn:    seconds until the current OTP expires
 *  - loading:      initial status fetch in flight
 *  - refresh:      re-fetch the status now (call after send/resend/verify)
 */
export const useOtpGuard = (email: string) => {
  const [resendIn, setResendIn] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockedIn, setLockedIn] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [hasActiveOtp, setHasActiveOtp] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const emailRef = useRef(email);
  emailRef.current = email;

  const refresh = useCallback(async () => {
    const current = emailRef.current;
    if (!current) return;
    try {
      const res = await AuthAPI.getOtpStatus(current);
      const data = res.data?.data;
      if (!data) return;
      setResendIn(data.resend_after_seconds ?? 0);
      setLocked(Boolean(data.locked));
      setLockedIn(data.locked_seconds ?? 0);
      setAttemptsLeft(data.attempts_remaining ?? null);
      setHasActiveOtp(Boolean(data.has_active_otp));
      setExpiresIn(data.otp_expires_in_seconds ?? 0);
    } catch {
      // No account / transient error — keep current state, allow resend.
      setResendIn(0);
    }
  }, []);

  // Initial fetch + refetch whenever email changes.
  useEffect(() => {
    let mounted = true;
    if (emailRef.current) {
      setLoading(true);
      AuthAPI.getOtpStatus(emailRef.current)
        .then((res) => {
          if (!mounted) return;
          const data = res.data?.data;
          if (!data) return;
          setResendIn(data.resend_after_seconds ?? 0);
          setLocked(Boolean(data.locked));
          setLockedIn(data.locked_seconds ?? 0);
          setAttemptsLeft(data.attempts_remaining ?? null);
          setHasActiveOtp(Boolean(data.has_active_otp));
          setExpiresIn(data.otp_expires_in_seconds ?? 0);
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, [email]);

  // Local countdown ticks (does not affect the server state).
  useEffect(() => {
    if (resendIn <= 0 && lockedIn <= 0) return;
    const timer = setTimeout(() => {
      setTick((t) => t + 1);
      if (resendIn > 0) setResendIn((s) => Math.max(0, s - 1));
      if (lockedIn > 0) setLockedIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendIn, lockedIn, tick]);

  // When a lockout expires, refresh from the server to unlock.
  useEffect(() => {
    if (locked && lockedIn <= 0) {
      setLocked(false);
      refresh();
    }
  }, [locked, lockedIn, refresh]);

  return {
    resendIn,
    locked,
    lockedIn,
    attemptsLeft,
    hasActiveOtp,
    expiresIn,
    loading,
    refresh,
  };
};
