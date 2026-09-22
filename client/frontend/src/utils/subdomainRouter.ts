// client/frontend/src/utils/subdomainRouter.ts
// Constructs role and tenant/branch specific URLs and manages subdomain redirection

export function getBaseDomain(): { baseDomain: string; port: string; protocol: string } {
  const { hostname, port, protocol } = window.location;
  const pStr = port ? `:${port}` : "";

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return { baseDomain: "localhost", port: pStr, protocol };
  }
  
  if (hostname.endsWith(".localhost")) {
    return { baseDomain: "localhost", port: pStr, protocol };
  }

  if (hostname.includes("ngrok-free.app")) {
    return { baseDomain: "ngrok-free.app", port: pStr, protocol };
  }

  if (hostname.includes("ngrok.app")) {
    const parts = hostname.split(".");
    if (parts.length >= 3 && parts.slice(-2).join(".") === "ngrok.app") {
      return { baseDomain: parts.slice(-3).join("."), port: pStr, protocol };
    }
    return { baseDomain: "ngrok.app", port: pStr, protocol };
  }

  if (hostname.includes("trycloudflare.com")) {
    return { baseDomain: "trycloudflare.com", port: pStr, protocol };
  }

  const parts = hostname.split(".");
  if (parts.length > 2) {
    return { baseDomain: parts.slice(-2).join("."), port: pStr, protocol };
  }

  return { baseDomain: hostname, port: pStr, protocol };
}

export function constructRoleSubdomainUrl(user: any, targetPath?: string): string {
  const { baseDomain, port, protocol } = getBaseDomain();
  const role = (user?.role || user?.roleName || "").toLowerCase().replace(/[\s_]+/g, "_");

  let orgSubdomain = "";
  if (user?.organizationSubdomain) {
    orgSubdomain = user.organizationSubdomain.toLowerCase();
  } else if (typeof user?.organization_id === "object") {
    orgSubdomain = (user.organization_id?.subdomain || user.organization_id?.organization_id || "").toLowerCase();
  } else if (typeof user?.organization_id === "string") {
    orgSubdomain = user.organization_id.toLowerCase();
  }

  let branchSubdomain = "";
  if (user?.branchSubdomain) {
    branchSubdomain = user.branchSubdomain.toLowerCase();
  } else if (typeof user?.branch_id === "object") {
    branchSubdomain = (user.branch_id?.subdomain || user.branch_id?.code || "").toLowerCase();
  } else if (typeof user?.branch_id === "string") {
    branchSubdomain = user.branch_id.toLowerCase();
  }

  let hostPrefix = "";
  let defaultPath = "/dashboard";

  if (role === "super_admin" || role === "platform_admin") {
    hostPrefix = "platform";
    defaultPath = "/superadmin/dashboard";
  } else if (role === "admin") {
    hostPrefix = orgSubdomain || "admin";
    defaultPath = "/admin/dashboard";
  } else if (role === "branch_admin") {
    if (branchSubdomain && orgSubdomain) {
      hostPrefix = `branchadmin.${branchSubdomain}.${orgSubdomain}`;
    } else if (branchSubdomain) {
      hostPrefix = `branchadmin.${branchSubdomain}`;
    } else if (orgSubdomain) {
      hostPrefix = `branchadmin.${orgSubdomain}`;
    } else {
      hostPrefix = "branchadmin";
    }
    defaultPath = "/admin/dashboard";
  } else if (role === "support") {
    if (branchSubdomain && orgSubdomain) {
      hostPrefix = `su.${branchSubdomain}.${orgSubdomain}`;
    } else if (orgSubdomain) {
      hostPrefix = `su.${orgSubdomain}`;
    } else {
      hostPrefix = "su";
    }
    defaultPath = "/support/dashboard";
  } else {
    // Customer
    if (branchSubdomain && orgSubdomain) {
      hostPrefix = `cu.${branchSubdomain}.${orgSubdomain}`;
    } else if (orgSubdomain) {
      hostPrefix = `cu.${orgSubdomain}`;
    } else {
      hostPrefix = "cu";
    }
    defaultPath = "/dashboard";
  }

  const fullHost = `${hostPrefix}.${baseDomain}${port}`;
  const path = targetPath || defaultPath;

  return `${protocol}//${fullHost}${path}`;
}

export function redirectUserToRoleSubdomain(user: any, token: string, targetPath?: string): boolean {
  if (!user || !token) return false;

  const hostname = window.location.hostname;
  // On Ngrok tunnels, multi-level subdomains (e.g. su.default.ngrok-free.dev) break HTTPS wildcard SSL certs.
  // We keep the active Ngrok tunnel domain and navigate via path routes instead.
  if (hostname.includes("ngrok")) {
    return false;
  }

  const targetUrlStr = constructRoleSubdomainUrl(user, targetPath);
  try {
    const targetUrl = new URL(targetUrlStr);
    const currentHost = window.location.host;

    if (targetUrl.host !== currentHost) {
      targetUrl.searchParams.set("auth_token", token);
      targetUrl.searchParams.set("auth_user", btoa(encodeURIComponent(JSON.stringify(user))));
      window.location.href = targetUrl.toString();
      return true;
    }
  } catch (err) {
    console.error("Failed to parse subdomain target URL:", err);
  }
  return false;
}
