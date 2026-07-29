Access Control Audit: Configuration-Driven Multi-Tenant System

Status: Largely implemented and aligned, with a few concentratedgaps and one significant architectural decision now resolved (Option A:single role.accesss store --- see below).

Maps the 8-step configuration-driven Access Control design to the actualbackend implementation in server/.

Step-by-step mapping

Step 1 --- Feature Registry

Design: each feature declares { module, accesss[] }. Adding a module =register its accesss. Implemented in: - server/utils/accesss.js ---PERMISSIONS (single source of truth, key -> description) andPERMISSION_CATEGORIES (ModuleName -> [keys[]]), plusDEFAULT_ROLE_PERMISSIONS, WILDCARD, and helpers hasAccess /hasAnyAccess / hasAllAccesss. - server/modules/access/* --- aread-only adapter over that registry: GET /accesss andGET /accesss/categories are served directly fromPERMISSIONS/PERMISSION_CATEGORIES. No DB Access collectionexists.

Verdict: aligned. The JS registry in utils/accesss.js is thesingle source of truth; new modules register accesss by adding toPERMISSIONS + PERMISSION_CATEGORIES, and the Role Accesss UI picksthem up automatically.

Step 2 --- Role Management

Design: Admin opens Settings → Roles → Create Role. Backend returnsevery registered access; admin selects; backend stores{ role, accesss:[...] }. No code changes required for new roles ---this is the key config-driven goal. Implemented in: -server/modules/role/* (schema stores role_name, organization_id,accesss: [String], isSystemRole, status). -server/modules/role/access.controller.js / .service.js / .route.js--- full Access Control surface:create/get/update/delete/clone/initialize/defaults-per-org, all scopedto req.user.organizationId. - Role creation does not require newcode (accesss are a free-form string array). Confirmed: the frontendrole manager already renders the full access set dynamically.

Verdict: aligned. The "no code changes for new roles" requirementholds.

Step 3 --- User Assignment

Design: User → Role → Accesss. A user gets a role; accesss are resolvedtransitively, never stored on the user. Implemented in: -server/modules/user-role/* (user_id, role_id, organization_id,assigned_by) --- join table. -server/modules/user-role/userRole.service.js ---getEffectiveAccesss(userId, orgId) unions role.accesss across all ofa user's active roles (nothing else) and caches them in Redis(perm:{userId}:{orgId}, 5 min).

Verdict: aligned, with one divergence --- a user may holdmultiple roles (the join table is one-to-many). Your spec implies asingle roleId per user (see Step 4 JWT). This is a behavioralchange, not a correctness bug. Flagged under Gaps.

Step 4 --- Login / JWT

Design: JWT carries { userId, tenantId, roleId }; backend loads Role →Accesss; login response includes the resolved access list. Implementedin: - server/modules/auth/token.service.js ---signAccessToken({ userId, organizationId, roles, email }). -server/modules/auth/auth.service.js --- login() resolves roles(getRoleNames) and accesss (getEffectiveAccesss) and returns bothin the response body; the access token embeds only{ userId, organizationId, roles, email }, NOT the accesss.

Verdict: intentionally diverges (and better). Accesss areintentionally not embedded in the JWT so role changes take effectimmediately without a re-login/re-token (see invalidateAccessCache).The login response still returns accesss for the frontend, satisfyingthe UX intent. organizationId plays the role of tenantId (seeNaming). No change recommended.

Step 5 --- Frontend

Frontend-only. Out of scope (backend audit). Note: the frontend alreadyimplements the can(...accesss) single-source-of-truth pattern(src/context/AuthContext.tsx, used by AdminSidebar.tsx filtering,ProdectedRoute.tsx). No role-name checks are observed in the currentfrontend routes.

Step 6 --- Backend middleware

Design: every API runsAuthenticate → Resolve Tenant → Load Accesss → authorize("perm") → Controller → Service → Repository.Returns 403 on missing access. Implemented in: -server/middleware/auth.middleware.js --- protect validates JWT,loads full user context (roles/accesss/org) into req.user (cached60s). - server/middleware/authorize.middleware.js --- access(...all)and anyAccess(...any) are the primary gates; tenantIsolationresolves/cross-checks tenant from params/body/query. - Routes are wiredconsistently: e.g. ticket.route.js, admin.route.js, chat.route.js,faq.route.js, document*.route.js all userouter.use(tenantIsolation) + access/anyAccess per verb. -Deprecated role-name gates authorize, requireRoles, and restrictstill live in auth.middleware.js/authorize.middleware.js but arenot used anywhere (no imports/references).

Verdict: aligned and consistently applied. Routes are access-gatedand tenant-scoped.

Step 7 --- Multi-Tenant Isolation

Design: every org-owned query is scoped by tenantId; cross-tenantaccess always denied even if a resource id is known. Implemented in: -server/utils/tenant.plugin.js --- adds organization_id + index toevery tenant-scoped schema. -server/middleware/authorize.middleware.js --- tenantIsolation(rejects foreign org ids on the wire) and assertTenant(req, extra)(produces { organization_id: req.user.organizationId }). - Servicesapply it: e.g. ticket.service.js, document.service.js,chat.service.js scope finds by organization_id. - selfOrAdmin* /ownerOrAdmin middlewares enforce ownership boundaries.

Verdict: aligned.

Step 8 --- Adding a New Module (e.g. Assets)

Design: register { module, accesss[] }, protect routes withauthorize("asset.view"), everything else (role UI, frontendvisibility) updates automatically. Implemented: exactly this flow ---add to utils/accesss.js, call access("asset.*") in the route.Roles/accesss resolve dynamically; the Role Accesss UI renders the newentries automatically. No DB sync step exists.

Verdict: aligned.

Gaps & discrepancies

Dual access stores --- RESOLVED (Option A). Historically accessswere read/written from two stores (role.accesss plus aRoleAccess join table → Access collection), andgetEffectiveAccesss unioned both. That risked silent access drift.

Option A (chosen, spec-strict): role.accesss is the onlystore. The Access/RoleAccess collections and theirroute/service/controller are gone; getEffectiveAccesss unionsrole.accesss across the user's active roles and nothing else;the code registry (utils/accesss.js) is served read-only viaGET /accesss & /accesss/categories.

The only remaining divergence from the strict single-role specis that a user may hold multiple roles (see #2).

Single vs. multiple roles per user. Your spec's JWT shows asingle roleId. The implementation allows multiple roles per uservia UserRole (a user can be both Support and Customer). Thefrontend can() already takes the union, so it keeps working. Onlymatters if you want to simplify to "one role = one access set." Lowpriority; leave as-is unless the single-role model is a hardrequirement.

organizationId vs. tenantId naming. Spec and docs usetenantId; the codebase uses organization_id / organizationIdend-to-end. Conceptually identical (Organization == Tenant).Renaming is cosmetic churn with no behavior impact and touchesdozens of files --- not recommended unless a hard API-namingrequirement exists.

Unused legacy role-based middleware. authorize, requireRoles(authorize.middleware.js), and restrict (auth.middleware.js)remain in the codebase but are not referenced anywhere. Theycontradict the spec's "no role checks anywhere." Recommend: add@deprecated JSDoc + remove in a follow-up (safe once confirmedunused).

Access registry is code, not DB --- by design. The registry(utils/accesss.js) is code, while role→access assignments live inthe DB (role.accesss). This matches the spec's Step 1 example(which is JS arrays). Accesss are deliberately not editable atruntime; a DB-backed editable registry is intentionally notprovided.

What is already correct / not worth changing

access() / anyAccess() as the sole authorization primitives,applied consistently across all routes viarouter.use(tenantIsolation).

getEffectiveAccesss caching + invalidation(invalidateAccessCache) so role edits take effect withoutre-authentication.

tenantIsolation cross-tenant guard on the wire + assertTenantquery-helper pattern.

JWT deliberately omitting accesss (better than the spec'sembed-accesss-in-JWT, since it enables live access changes).

Access-based, not role-name-based, UI gating (can()).

Changes applied (Option A)

Following the audit, the backend was realigned to the spec'ssingle-source-of-truth model. role.accesss (the array) is theonly store for role→access assignments; the DB Access collectionis removed and the centralized Feature Registry (utils/accesss.js)is served read-only via GET /accesss & /accesss/categories.

server/utils/accesss.js: added isAccessKnown(key) andnormalizeAccessList(accesss) --- the registry validator used onevery role write (drops unknown keys with a warning, deduplicates,preserves *).

server/modules/user-role/userRole.service.js(getEffectiveAccesss): reads only role.accesss (removed therole-name super-admin heuristic). Cache + wildcard detectionpreserved.

server/modules/role/role.service.js: removed every dual-write tothe join table(createRole/updateRole/cloneRole/deleteRole/initializeRoles/createDefaultRolesForOrganization);all access lists now run through normalizeAccessList so the storedarray is always config-driven and clean.

server/modules/access/*: now a read-only registry adapter (noaccess.schema.js, no create/update/delete/initialize).getAllAccesss/getAccessCategories serve straight fromPERMISSIONS/PERMISSION_CATEGORIES. Routes reduced to GET / andGET /categories.

server/seed.js + server/scripts/seedAccess Control.js: removedall Access-collection seeding (registry is code-defined; nothingto materialize).

server/modules/role-access/: deleted(schema/service/controller/route/index); server.js nolonger mounts /role-accesss.

client/frontend/src/api/admin.api.js: removed dead /accesss CRUDand /role-accesss/* methods; kept getAccessCategories.

What was left as-is (and why)

JWT does not embed accesss --- accesss are loaded from DB/Redisper request (protect cache 60s, getEffectiveAccesss cache 5min). This is better than the spec's "accesss in JWT" design: roleedits take effect immediately. invalidateAccessCache still runs onrole/assignment writes.

Multi-role users --- the spec implies a single roleId, butmultiple roles per user is a safe superset and the frontend can()already unions them. Not a correctness issue; left to avoid abehavior regression.

Feature Registry --- kept the utils/accesss.js registry as theonly source, exposed read-only via the /accesss API so therole-management UI can render the full catalogue. No DB mirror;"configuration-driven" rather than "data-driven".

Security audit --- loopholes found & fixed (application-wide)

Full-application audit for privilege escalation, mass assignment, tenantisolation, and dead/gapped authorization. All fixed this session.

1. Public by-domain org leak (CRITICAL)

GET /auth/v1/organizations/by-domain (pre-auth) returned the fullorg document --- including api_keys (raw key strings), ai_settings,usage counters, email_templates. Anyone could query any org by domain.Fix (server/modules/auth/auth.route.js): .select() only brandingfields (name, domain, address, phone, email, logo,brand_colors, chart_colors, show_charts, chatbot_name,default_language, greeting_message, organization_id). Thetenant-detection hook (useTenant) only needs these.

2. Super Admin / wildcard role escalation (CRITICAL)

role.accesss can contain * (the global Super Admin role,organization_id: null, is never filtered from role lookups). Everyuntrusted role-assignment boundary accepted a crafted role_id pointingat that role → a tenant admin could mint a Super Admin. Fixed with ashared guard resolveAssignableRole(roleId, orgId)(server/modules/user-role/userRole.service.js): rejects non-activeroles, roles owned by a different org, and any role carrying *.Applied at every boundary: - POST /user-roles/assign(userRole.route.js) - userService.createUser /userService.updateUser (user.service.js) - approveRegistration(approval.service.js) --- also filters Super Admin out of the"available roles" picker.

Additionally roleService.createRole / updateRole now throw(assertNoWildcard) if a role would be created/edited with * accesss,so no role (tenant or otherwise) can smuggle the wildcard through therole UI.

3. Tenant admin could create/delete organizations (HIGH)

POST/PUT/DELETE /organizations (org router) andPOST/PUT/DELETE /admin/v1/organizations* (admin router) were gated byorg.manage --- a tenant-admin access. A tenant admin could createnew (orphaned) orgs, or delete/edit their org through the genericendpoint (mass-assignment). Fix: all org mutations now requireaccess("*") (super admin only). Tenant admins keep their dedicatedGET/PUT /admin/v1/organization/settings for branding. AdditionallyorgService.updateOrganization now whitelists editable fields(ORG_UPDATE_ALLOWLIST) --- status, plan, domain, api_keys,owner_id, usage/subscription fields are no longer writable through thegeneric update path.

4. Weak user-mutation accesss (MEDIUM)

PUT /users/:id and DELETE /users/:id were gated by user.view(viewing grants editing/deleting). Fix: new access user.updateadded to the registry; routes now requireanyAccess("user.update", "user.invite", "user.disable") --- safe forexisting DB roles (admins already carry user.invite/user.disable),so no regression for tenants whose roles predate the change.

5. Mass-assignment on updateUser (MEDIUM)

updateUser wrote req.body wholesale(findOneAndUpdate(filter, userData)), so a tenant admin could move auser to another organization_id or flip auth_type/email_verified.Fix: field allowlist (name, email, phone, status, role_id)in user.service.js:updateUser.

6. Frontend portal misresolution (HIGH)

resolvePortal() (src/lib/access.ts) branched on overlapping accesss:Support's default role carries report.view_dashboard (→ misclassifiedas admin), and Customer's default role carriesticket.view/chat.view (→ misclassified as support). Users wereredirected into the wrong portal/layout. Fix: resolvePortal nowuses per-portal anchor accesss in precedence order --- * →superadmin, user.view → admin,report.view_dashboard/ticket.assign/chat.end → support, elsecustomer. ProtectedRoute gained a portal prop that redirects tohomePathFor(user) when the resolved portal doesn't match the routetree (each portal subtree passes its portal: superadmin, admin,support, customer). Still zero role-name checks.

Verified

node --check passes on all changed server modules.

npx tsc --noEmit exit 0; npm run build succeeds(client/frontend).

The shared /profile route stays portal-agnostic (SupportLayoutstill points at it), so support agents keep profile access whilecustomer pages are gated to the customer portal.