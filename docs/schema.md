# Data Model / Schema Documentation

Complete reference for every Mongoose collection, schema field, index, relationship, and validation rule in the SupportAI customer AIBased support application.

## Files Reviewed

| Category | Files |
|---|---|
| **Schema files** (25) | `server/modules/ai-session/aiSession.schema.js`, `server/modules/audit-log/auditLog.schema.js`, `server/modules/chat/chat.schema.js`, `server/modules/communication/communication.schema.js`, `server/modules/document/document.schema.js`, `server/modules/document/documentChunk.schema.js`, `server/modules/document/documentRoleAccess.schema.js`, `server/modules/document-type/documentType.schema.js`, `server/modules/document-verification/documentVerification.schema.js`, `server/modules/faq/faq.schema.js`, `server/modules/global-setting/globalSetting.schema.js`, `server/modules/knowledge-gap/knowledgeGap.schema.js`, `server/modules/memory/memory.schema.js`, `server/modules/message/message.schema.js`, `server/modules/notification/notification.schema.js`, `server/modules/organization/organization.schema.js`, `server/modules/prompt-version/promptVersion.schema.js`, `server/modules/refresh-session/refreshSession.schema.js`, `server/modules/registration-request/registrationRequest.schema.js`, `server/modules/role/role.schema.js`, `server/modules/ticket/ticket.schema.js`, `server/modules/ticket/ticketMessage.schema.js`, `server/modules/ticket/ticketTemplate.schema.js`, `server/modules/user/user.schema.js`, `server/modules/user-role/userRole.schema.js` |
| **Validation files** (15) | `server/validation/auth.validation.js`, `server/validation/chat.validation.js`, `server/validation/document.validation.js`, `server/validation/documentType.validation.js`, `server/validation/documentVerification.validation.js`, `server/validation/faq.validation.js`, `server/validation/globalSetting.validation.js`, `server/validation/index.js`, `server/validation/memory.validation.js`, `server/validation/message.validation.js`, `server/validation/notification.validation.js`, `server/validation/organization.validation.js`, `server/validation/organizationSettings.validation.js`, `server/validation/rag.validation.js`, `server/validation/role.validation.js`, `server/validation/ticket.validation.js`, `server/validation/user.validation.js` |
| **Seed / bootstrap** (2) | `server/seed.js`, `server/scripts/seedRBAC.js` |
| **Constants** (1) | `server/utils/constants.js` |
| **Tenant plugin** (1) | `server/utils/tenant.plugin.js` |
| **Permissions** (1) | `server/utils/permissions.js` |
| **Role service** (1) | `server/modules/role/role.service.js` |

---

## Shared Infrastructure

### Enum Constants (`server/utils/constants.js`)

| Constant | Values |
|---|---|
| `TICKET_CATEGORIES` | `"bug"`, `"feature_request"`, `"question"`, `"billing"`, `"account"`, `"other"` |
| `TICKET_STATUSES` | `"open"`, `"pending"`, `"assigned"`, `"in_progress"`, `"waiting_for_customer"`, `"resolved"`, `"closed"` |
| `TICKET_PRIORITIES` | `"low"`, `"medium"`, `"high"`, `"urgent"` |
| `CHAT_STATUSES` | `"open"`, `"closed"` |
| `CHAT_PRIORITIES` | `"low"`, `"medium"`, `"high"`, `"urgent"` |
| `DOCUMENT_STATUSES` | `"draft"`, `"pending"`, `"approved"`, `"rejected"` |
| `ADMIN_ROLES` | `"super admin"`, `"tenant admin"`, `"admin"` |
| `RESTRICTED_ROLES` | `"tenant admin"`, `"super admin"` |

### Permission Registry (`server/utils/permissions.js`)

#### Permission Keys (41 total)

| Category | Permissions |
|---|---|
| Ticket | `ticket.view`, `ticket.create`, `ticket.edit`, `ticket.delete`, `ticket.assign`, `ticket.close`, `ticket.reopen`, `ticket.view_all`, `ticket.view_assigned`, `ticket.reply` |
| Chat | `chat.view`, `chat.reply`, `chat.transfer`, `chat.end`, `chat.view_history`, `chat.use_ai` |
| Documents | `document.view`, `document.upload`, `document.edit`, `document.delete`, `document.download`, `document.share`, `document.approve` |
| Knowledge Base | `knowledge.view`, `knowledge.create`, `knowledge.edit`, `knowledge.publish`, `knowledge.delete` |
| User Management | `user.view`, `user.invite`, `user.update`, `registration.approve`, `user.disable`, `role.assign`, `role.create`, `role.delete` |
| AI | `ai.chat`, `ai.reply_generate`, `ai.summarize`, `ai.train_kb`, `ai.upload_documents` |
| Reports | `report.view_dashboard`, `report.view`, `report.export` |
| Notifications | `notification.create`, `notification.view`, `notification.broadcast` |
| Organization | `org.manage`, `org.view` |

#### Default Role Permissions

| Role | Permissions |
|---|---|
| **Super Admin** | `*` (wildcard — all permissions) |
| **Admin** | All permissions across every category |
| **Support** | `ticket.view`, `ticket.view_assigned`, `ticket.reply`, `ticket.assign`, `ticket.close`, `ticket.reopen`, `chat.view`, `chat.reply`, `chat.transfer`, `chat.end`, `chat.view_history`, `chat.use_ai`, `document.view`, `knowledge.view`, `ai.chat`, `ai.reply_generate`, `ai.summarize`, `report.view_dashboard`, `report.view`, `notification.view` |
| **Customer** | `ticket.create`, `ticket.view`, `ticket.reply`, `chat.view`, `chat.reply`, `chat.use_ai`, `document.view`, `document.upload`, `knowledge.view`, `ai.chat`, `notification.view` |

#### Role Keys

| Key | Value |
|---|---|
| `ROLE_KEYS.SUPER_ADMIN` | `"Super Admin"` |
| `ROLE_KEYS.ADMIN` | `"Admin"` |
| `ROLE_KEYS.SUPPORT` | `"Support"` |
| `ROLE_KEYS.CUSTOMER` | `"Customer"` |
| `REQUESTABLE_ROLE_KEYS` | `Customer`, `Support` (roles self-registration may request) |
| `RESTRICTED_ROLE_KEYS` | `Super Admin` (never self-requestable) |

### Tenant Plugin (`server/utils/tenant.plugin.js`)

A reusable Mongoose plugin applied to **User**, **Chat**, **Ticket**, **Document**, and **Notification**.

- **Injected field:** `organization_id` — `ObjectId`, `ref: "Organization"`, `required: true`
- **Injected index:** `{ organization_id: 1, created_at: -1 }` — compound index for multi-tenant query optimization
- Purpose: enforces multi-tenancy by ensuring every record in tenant-scoped collections belongs to an organization and is indexed for fast org-scoped lookups.

---

## Model Reference

### 1. Organization

**File:** `server/modules/organization/organization.schema.js`  
**Model name:** `Organization`  
**Collection:** `organizations`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | String | Yes | — | `unique: true`, `trim` not applied |
| `name` | String | No | — | `trim: true` |
| `domain` | String | No | — | `unique: true`, `sparse: true`, `trim: true`, `lowercase: true` |
| `address` | String | No | — | — |
| `phone` | String | No | — | `maxlength: 20` |
| `email` | String | No | — | `unique: true`, `lowercase: true`, `maxlength: 255` |
| `owner_id` | ObjectId ref: User | No | `null` | `index: true` |
| `status` | String | No | `"active"` | `enum: ["active", "inactive", "suspended"]` |
| `plan` | String | No | `"free"` | `enum: ["free", "starter", "business", "enterprise"]` |
| `customPrompt` | String | No | `""` | — |
| `logo.url` | String | No | `""` | — |
| `logo.public_id` | String | No | `""` | — |
| `brand_colors.primary` | String | No | `"#2563eb"` | — |
| `brand_colors.secondary` | String | No | `"#7c3aed"` | — |
| `brand_colors.accent` | String | No | `"#f59e0b"` | — |
| `chart_colors.primary` | String | No | `"#2563eb"` | — |
| `chart_colors.secondary` | String | No | `"#7c3aed"` | — |
| `chart_colors.tertiary` | String | No | `"#059669"` | — |
| `chart_colors.quaternary` | String | No | `"#f59e0b"` | — |
| `chart_colors.grid` | String | No | `"#e2e8f0"` | — |
| `chart_colors.text` | String | No | `"#64748b"` | — |
| `chart_colors.background` | String | No | `"#ffffff"` | — |
| `show_charts` | Boolean | No | `true` | — |
| `ai_session_logging` | Boolean | No | `true` | — |
| `chatbot_name` | String | No | `"Support AI"` | — |
| `default_language` | String | No | `"en"` | — |
| `greeting_message` | String | No | `"Hello! How can I help you today?"` | — |
| `ai_settings.temperature` | Number | No | `0.7` | `min: 0`, `max: 2` |
| `ai_settings.top_k` | Number | No | `40` | — |
| `ai_settings.similarity_threshold` | Number | No | `0.75` | `min: 0`, `max: 1` |
| `ai_settings.max_tokens` | Number | No | `2048` | — |
| `ai_settings.response_style` | String | No | `"balanced"` | `enum: ["concise", "balanced", "detailed"]` |
| `guardrails` | Array of {rule, enabled} | No | `[]` | — |
| `working_hours.timezone` | String | No | `"UTC"` | — |
| `working_hours.monday` | Object (workingDaySchema) | No | `{}` | {open, close, enabled} |
| `working_hours.tuesday` | Object (workingDaySchema) | No | `{}` | {open, close, enabled} |
| `working_hours.wednesday` | Object (workingDaySchema) | No | `{}` | {open, close, enabled} |
| `working_hours.thursday` | Object (workingDaySchema) | No | `{}` | {open, close, enabled} |
| `working_hours.friday` | Object (workingDaySchema) | No | `{}` | {open, close, enabled} |
| `working_hours.saturday` | Object (workingDaySchema) | No | `{open:"10:00", close:"14:00", enabled:false}` | {open, close, enabled} |
| `working_hours.sunday` | Object (workingDaySchema) | No | `{open:"10:00", close:"14:00", enabled:false}` | {open, close, enabled} |
| `email_templates.ticket_assigned.subject` | String | No | `"New ticket assigned: {{ticket_id}}"` | — |
| `email_templates.ticket_assigned.body` | String | No | — | — |
| `email_templates.ticket_resolved.subject` | String | No | `"Ticket resolved: {{ticket_id}}"` | — |
| `email_templates.ticket_resolved.body` | String | No | — | — |
| `storage_used` | Number | No | `0` | — |
| `storage_limit` | Number | No | `524288000` (500 MB) | — |
| `ai_requests_month` | Number | No | `0` | — |
| `ai_requests_limit` | Number | No | `1000` | — |
| `ai_requests_reset_at` | Date | No | — | — |
| `subscription_start` | Date | No | — | — |
| `subscription_end` | Date | No | — | — |
| `api_keys` | Array of {key, name, created_at, last_used, is_active} | No | `[]` | `key` required, `name` required |
| `created_at` | Date | System | — | Mongoose timestamp (createdAt) |
| `updated_at` | Date | System | — | Mongoose timestamp (updatedAt) |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1 }` — from `unique` on `organization_id` | unique |
| `{ domain: 1 }` | `unique: true`, `sparse: true` |
| `{ email: 1 }` | `unique: true` |
| `{ owner_id: 1 }` | `index: true` |

> Note: `organization_id` is NOT injected by the tenant plugin in this schema (Organization is the top-level tenant entity, so it has its own `organization_id` business key instead).

#### Validation Rules

- `organization_id` must be unique (MongoDB enforces this via unique index)
- `domain` is a sparse unique index — multiple documents can have `null`/empty domain, but non-null values must be unique
- `email` must be unique across all organizations

---

### 2. User

**File:** `server/modules/user/user.schema.js`  
**Model name:** `User`  
**Collection:** `users`  
**Plugins:** `tenantPlugin` (injects `organization_id`)

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | String | Yes | — | `maxlength: 100` |
| `email` | String | Yes | — | `maxlength: 100`, `unique: true`, `lowercase: true`, `trim: true`, `match: /^\S+@\S+\.\S+$/` |
| `phone` | String | No | — | `maxlength: 20` |
| `password` | String | No | `null` | `maxlength: 255` |
| `dob` | Date | No | — | — |
| `auth_type` | String | No | `"local"` | `enum: ["local", "google", "facebook"]`, `maxlength: 30` |
| `status` | String | No | `"pending"` | `enum: ["pending", "active", "rejected", "disabled"]` |
| `requested_role_id` | ObjectId ref: Role | No | `null` | — |
| `email_verified` | Boolean | No | `false` | — |
| `email_verified_at` | Date | No | `null` | — |
| `oauth.provider` | String | No | `null` | `enum: ["google", "facebook"]` |
| `oauth.provider_id` | String | No | `null` | — |
| `oauth.picture` | String | No | `null` | — |
| `approved_by` | ObjectId ref: User | No | `null` | — |
| `approved_at` | Date | No | `null` | — |
| `rejection_reason` | String | No | `null` | `maxlength: 500` |
| `role_id` | ObjectId ref: Role | No | `null` | — |
| `last_login_at` | Date | No | `null` | — |
| `fcm_token` | String | No | `null` | — |
| `otp` | String | No | `null` | — |
| `otp_expiry` | Date | No | `null` | — |
| `organization_id` | ObjectId ref: Organization | Yes (injected) | — | `index: true` (auto) |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ email: 1 }` | `unique: true` |
| `{ "oauth.provider": 1, "oauth.provider_id": 1 }` | `unique: true`, `sparse: true` |
| `{ organization_id: 1, email: 1 }` | — |
| `{ organization_id: 1, status: 1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin |

#### Relationships / References

- `organization_id` → Organization (many-to-one, tenant scoping)
- `requested_role_id` → Role (the role the user requested during registration)
- `role_id` → Role (current assigned role)
- `approved_by` → User (self-reference: who approved this user)

#### Special Validation Rules

- `email` must match regex `/^\S+@\S+\.\S+$/` (no spaces, must contain `@` and a dot in the domain part)
- `status` enum controls approval workflow:
  - `pending` — awaiting admin approval
  - `active` — approved and active
  - `rejected` — registration rejected by admin
  - `disabled` — disabled by admin after activation
- `auth_type` enum distinguishes local vs OAuth registrations
- OAuth fields (`oauth.provider`, `oauth.provider_id`) are only populated for OAuth users

#### Validation Schema (Zod)

From `user.validation.js`:
- `createUserSchema`: `organization_id` (required), `role_id` (required), `name` (1–100 chars), `email` (valid email, ≤100), `phone` (optional, ≤20), `password` (8–128 chars), `dob` (optional date string), `auth_type` (optional enum)
- `updateUserSchema`: all fields optional except validation constraints
- `updateUserStatusSchema`: `status` must be one of `["pending", "active", "rejected", "disabled"]`
- `updateProfileSchema`: `name` (1–100), `phone` (≤20), `dob`, `fcm_token`
- `userPasswordSchema`: `currentPassword` (required), `newPassword` (8–128 chars)
- `requestOtpSchema`: `email` (required, valid)
- `verifyOtpSchema`: `email` (required), `otp` (exactly 6 chars)
- `resetPasswordWithOtpSchema`: `email` (required), `otp` (6 chars), `newPassword` (8–128 chars)

---

### 3. Role

**File:** `server/modules/role/role.schema.js`  
**Model name:** `Role`  
**Collection:** `roles`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `role_name` | String | Yes | — | `maxlength: 50`, `trim: true` |
| `organization_id` | ObjectId ref: Organization | No | `null` | — |
| `permissions` | Array of String | No | `[]` | `maxlength: 100` (per element) |
| `isSystemRole` | Boolean | No | `false` | `index: true` |
| `status` | String | No | `"active"` | `enum: ["active", "inactive"]` |
| `description` | String | No | — | `maxlength: 200` |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ role_name: 1, organization_id: 1 }` | `unique: true` — global + per-org role name uniqueness |
| `{ organization_id: 1, status: 1 }` | — |
| `{ isSystemRole: 1, organization_id: 1 }` | — |

#### Relationships / References

- `organization_id` → Organization (null means a global/system-level role template)

#### Special Validation Rules

- Composite unique constraint on `(role_name, organization_id)` means:
  - Global roles (organization_id = null) have unique names
  - Per-organization roles have unique names within that org
  - Global and org-specific roles with the same name can coexist
- `isSystemRole` flag distinguishes system-created roles from custom ones
- "Super Admin" role name cannot be created via normal service flow — protected in `role.service.js`

#### Validation Schema (Zod)

From `role.validation.js`:
- `createRoleSchema`: `role_name` (1–50, cannot be "super admin"), `organization_id` (optional), `permissions` (string array, max 100 per element), `status` (enum, defaults to "active"), `description` (max 200, defaults to "")
- `updateRoleSchema`: all fields optional with same constraints

#### Seed Data (`server/seed.js`, `server/scripts/seedRBAC.js`)

Four standard roles seeded globally (organization_id = null):
- **Super Admin** — permissions: `[*]` (wildcard)
- **Admin** — full permission set across all categories
- **Support** — support agent permissions (see permissions table above)
- **Customer** — customer permissions (see permissions table above)

Each new organization automatically gets 3 org-specific roles (organization_id = org._id):
- **Organization Admin** — full permission set
- **Support** — support agent permissions
- **Customer** — customer permissions

---

### 4. UserRole

**File:** `server/modules/user-role/userRole.schema.js`  
**Model name:** `UserRole`  
**Collection:** `userroles`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `role_id` | ObjectId ref: Role | Yes | — | — |
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `assigned_by` | ObjectId ref: User | No | `null` | — |
| `assigned_at` | Date | No | `Date.now` | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ user_id: 1, role_id: 1, organization_id: 1 }` | `unique: true` — no duplicate role assignments |
| `{ organization_id: 1, role_id: 1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin (wait — no, tenantPlugin is NOT applied here) |

> Correction: tenantPlugin is NOT applied to UserRole. The schema only defines `organization_id` explicitly as a required field without the plugin.

#### Relationships / References

- `user_id` → User (many-to-many join)
- `role_id` → Role (many-to-many join)
- `organization_id` → Organization (scopes the assignment to the tenant)
- `assigned_by` → User (self-reference: admin who made the assignment)

#### Special Validation Rules

- Unique composite constraint on `(user_id, role_id, organization_id)` prevents duplicate role assignments
- A user can have multiple roles within the same organization

---

### 5. RefreshSession

**File:** `server/modules/refresh-session/refreshSession.schema.js`  
**Model name:** `RefreshSession`  
**Collection:** `refreshsessions`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `token_hash` | String | Yes | — | `unique: true`, `index: true` |
| `user_agent` | String | No | `""` | — |
| `ip` | String | No | `""` | — |
| `expires_at` | Date | Yes | — | — |
| `revoked_at` | Date | No | `null` | — |
| `last_used_at` | Date | No | `Date.now` | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ token_hash: 1 }` | `unique: true` |
| `{ user_id: 1, revoked_at: 1 }` | — |
| `{ expires_at: 1 }` | `expireAfterSeconds: 0` — TTL index for automatic cleanup |

#### Relationships / References

- `user_id` → User (the token owner)
- `organization_id` → Organization (tenant scoping)

#### Special Validation Rules

- The actual refresh token is never stored — only a SHA-256 hash (`token_hash`)
- The `expires_at` field has a TTL index (`expireAfterSeconds: 0`) so expired sessions are automatically deleted by MongoDB
- "Log out from all devices" is implemented by deleting all rows for a user (deleting by `user_id`)
- `revoked_at` set to a Date indicates the session was explicitly revoked before expiry

---

### 6. RegistrationRequest

**File:** `server/modules/registration-request/registrationRequest.schema.js`  
**Model name:** `RegistrationRequest`  
**Collection:** `registrationrequests`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `requested_role_id` | ObjectId ref: Role | No | `null` | — |
| `name` | String | Yes | — | `maxlength: 100` |
| `email` | String | Yes | — | `maxlength: 100`, `lowercase: true`, `trim: true` |
| `provider` | String | No | `"local"` | `enum: ["local", "google", "facebook"]` |
| `status` | String | No | `"pending"` | `enum: ["pending", "approved", "rejected"]`, `index: true` |
| `rejection_reason` | String | No | `null` | `maxlength: 500` |
| `approved_by` | ObjectId ref: User | No | `null` | — |
| `approved_at` | Date | No | `null` | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, status: 1, created_at: -1 }` | — |

#### Relationships / References

- `organization_id` → Organization (which organization the user is registering to)
- `user_id` → User (a User record is created in parallel, pending approval)
- `requested_role_id` → Role (the role the user requested during registration)
- `approved_by` → User (admin who approved the registration)

#### Special Validation Rules

- Kept separate from the User collection so rejected/duplicate attempts don't pollute User
- Status workflow: `pending` → `approved` or `rejected`
- The schema docstring notes this exists so approval dashboards can query directly without touching User

---

### 7. Chat

**File:** `server/modules/chat/chat.schema.js`  
**Model name:** `Chat`  
**Collection:** `chats`  
**Plugins:** `tenantPlugin` (injects `organization_id`)

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `assigned_to` | ObjectId ref: User | No | `null` | — |
| `topic` | String | No | `"General"` | `maxlength: 255` |
| `priority` | String | No | `"medium"` | `enum: CHAT_PRIORITIES` |
| `status` | String | No | `"open"` | `enum: CHAT_STATUSES`, `index: true` |
| `last_message_at` | Date | No | `Date.now` | — |
| `organization_id` | ObjectId ref: Organization | Yes (injected) | — | `index: true` (auto) |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, status: 1, last_message_at: -1 }` | — |
| `{ organization_id: 1, user_id: 1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `user_id` → User (the customer who started the chat)
- `assigned_to` → User (the support agent assigned to this chat)

#### Validation Schema (Zod)

From `chat.validation.js`:
- `createChatSchema`: `topic` optional (max 255 chars)
- `updateTopicSchema`: `topic` required (1–255 chars)

---

### 8. Message

**File:** `server/modules/message/message.schema.js`  
**Model name:** `Message`  
**Collection:** `messages`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `chat_id` | ObjectId ref: Chat | Yes | — | `index: true` |
| `sender_id` | ObjectId ref: User | Yes | — | — |
| `content` | String | Yes | — | — |
| `message_type` | String | No | `"text"` | `enum: ["text", "image", "file", "system"]` |
| `is_ai` | Boolean | No | `false` | `index: true` |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ chat_id: 1, created_at: 1 }` | — (message ordering within a chat) |

#### Relationships / References

- `chat_id` → Chat (a message belongs to one chat)
- `sender_id` → User (the user or AI bot that sent the message)

#### Validation Schema (Zod)

From `message.validation.js`:
- `sendMessageSchema`: `chat_id` (required), `sender_id` (required), `content` (1–10000 chars), `message_type` (optional enum), `is_ai` (optional boolean)
- `updateMessageSchema`: `content` (1–10000 chars, required)

---

### 9. AISession

**File:** `server/modules/ai-session/aiSession.schema.js`  
**Model name:** `AISession`  
**Collection:** `aisessions`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `chat_id` | ObjectId ref: Chat | Yes | — | `index: true` |
| `model` | String | No | — | `maxlength: 100` |
| `tokens_used` | Number | No | `0` | — |
| `messages_count` | Number | No | `0` | — |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: `timestamps` only tracks `created_at`; `updatedAt: false` disables the `updated_at` field.

#### Indexes

| Fields | Options |
|---|---|
| `{ chat_id: 1 }` | `index: true` (per-field index) |

#### Relationships / References

- `chat_id` → Chat (one AI session per chat)

#### Special Validation Rules

- Only tracks creation timestamp — no updates tracked
- Used for AI usage analytics (token consumption, message count) per chat session

---

### 10. Ticket

**File:** `server/modules/ticket/ticket.schema.js`  
**Model name:** `Ticket`  
**Collection:** `tickets`  
**Plugins:** `tenantPlugin` (injects `organization_id`)

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `assigned_to` | ObjectId ref: User | No | `null` | — |
| `subject` | String | Yes | — | `maxlength: 255` |
| `description` | String | Yes | — | — |
| `category` | String | No | `"other"` | `enum: TICKET_CATEGORIES` |
| `status` | String | No | `"open"` | `enum: TICKET_STATUSES` |
| `priority` | String | No | `"medium"` | `enum: TICKET_PRIORITIES` |
| `tags` | Array of String | No | `[]` | `maxlength: 50` per element |
| `escalated_from_chat.chat_id` | ObjectId ref: Chat | No | `null` | — |
| `escalated_from_chat.confidence_score` | Number | No | — | `min: 0`, `max: 1` |
| `escalated_from_chat.conversation_preview` | String | No | — | `maxlength: 2000` |
| `due_date` | Date | No | — | — |
| `resolved_by` | ObjectId ref: User | No | `null` | — |
| `resolved_at` | Date | No | — | — |
| `closed_by` | ObjectId ref: User | No | `null` | — |
| `closed_at` | Date | No | — | — |
| `organization_id` | ObjectId ref: Organization | Yes (injected) | — | `index: true` (auto) |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, status: 1, assigned_to: 1 }` | — |
| `{ organization_id: 1, user_id: 1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `user_id` → User (the customer who created the ticket)
- `assigned_to` → User (the support agent assigned)
- `escalated_from_chat.chat_id` → Chat (if this ticket was escalated from a chat)
- `resolved_by` → User (who resolved it)
- `closed_by` → User (who closed it)

#### Special Validation Rules

- Status workflow: `open` → `pending` → `assigned` → `in_progress` → `waiting_for_customer` → `resolved` → `closed`
- Priority levels: `low`, `medium`, `high`, `urgent`
- Can be escalated from a Chat conversation, with confidence score and conversation preview

#### Validation Schema (Zod)

From `ticket.validation.js`:
- `createTicketSchema`: `user_id` (required), `organization_id` (required), `assigned_to` (optional), `subject` (1–255 chars, required), `description` (1–5000 chars, required), `priority` (optional enum)
- `assignTicketSchema`: `supportId` (required)
- `updatePrioritySchema`: `priority` (required enum)

---

### 11. TicketMessage

**File:** `server/modules/ticket/ticketMessage.schema.js`  
**Model name:** `TicketMessage`  
**Collection:** `ticketmessages`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `ticket_id` | ObjectId ref: Ticket | Yes | — | `index: true` |
| `sender_id` | ObjectId ref: User | Yes | — | — |
| `content` | String | Yes | — | — |
| `attachments` | Array of {file_name, file_url, file_type} | No | `[]` | — |
| `is_internal` | Boolean | No | `false` | — |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: `timestamps.createdAt` maps to `created_at`; `updatedAt: false` means no `updated_at` field.

#### Indexes

None explicitly defined (only the per-field `index: true` on `ticket_id`).

#### Relationships / References

- `ticket_id` → Ticket (a message belongs to one ticket)
- `sender_id` → User (the user or agent who sent the message)

#### Special Validation Rules

- `is_internal` messages are visible only to support staff, not customers

---

### 12. TicketTemplate

**File:** `server/modules/ticket/ticketTemplate.schema.js`  
**Model name:** `TicketTemplate`  
**Collection:** `tickettemplates`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `name` | String | Yes | — | `maxlength: 100` |
| `category` | String | Yes | — | `maxlength: 100` |
| `default_priority` | String | No | `"medium"` | `enum: ["low", "medium", "high", "urgent"]` |
| `default_subject` | String | Yes | — | `maxlength: 255` |
| `default_description` | String | Yes | — | — |
| `is_active` | Boolean | No | `true` | `index: true` |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1 }` | `index: true` (per-field) |
| `{ organization_id: 1, is_active: 1 }` | `index: true` (per-field on `is_active`) |

> Wait, correction: `organization_id` has `index: true` in the field definition, and `is_active` has `index: true` in the field definition. No separate compound index is declared.

#### Relationships / References

- `organization_id` → Organization (template belongs to one org)

#### Special Validation Rules

- Templates provide pre-filled subject, description, category, and priority for new tickets

---

### 13. Document

**File:** `server/modules/document/document.schema.js`  
**Model name:** `Document`  
**Collection:** `documents`  
**Plugins:** `tenantPlugin` (injects `organization_id`)

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `document_type_id` | ObjectId ref: DocumentType | No | — | — |
| `title` | String | Yes | — | `maxlength: 255` |
| `file_id` | ObjectId (Mongo file ID) | Yes | — | — |
| `file_name` | String | Yes | — | — |
| `file_mimetype` | String | Yes | — | — |
| `file_size` | Number | No | `0` | — |
| `assigned_role` | String | No | `"all"` | `index: true` |
| `status` | String | No | `"draft"` | `enum: DOCUMENT_STATUSES` |
| `approved_by` | ObjectId ref: User | No | — | — |
| `approved_at` | Date | No | — | — |
| `organization_id` | ObjectId ref: Organization | Yes (injected) | — | `index: true` (auto) |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, status: 1 }` | — |
| `{ organization_id: 1, document_type_id: 1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `user_id` → User (uploader)
- `document_type_id` → DocumentType (categorization)
- `approved_by` → User (who approved the document)

#### Special Validation Rules

- `file_id` is a Mongo ObjectId (typically from GridFS or a file store reference)
- Documents go through a workflow: `draft` → `pending` → `approved`/`rejected`
- `assigned_role` controls role-based access to the document

#### Validation Schema (Zod)

From `document.validation.js`:
- `createDocumentSchema`: `user_id` (optional), `organization_id` (optional), `document_type_id` (optional), `title` (1–255 chars, required), `assigned_role` (optional)
- `updateDocumentStatusSchema`: `status` (required enum), `assigned_role` (optional)

---

### 14. DocumentType

**File:** `server/modules/document-type/documentType.schema.js`  
**Model name:** `DocumentType`  
**Collection:** `documenttypes`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `name` | String | Yes | — | `maxlength: 100`, `unique: true` |
| `description` | String | No | — | `maxlength: 500` |

#### Indexes

| Fields | Options |
|---|---|
| `{ name: 1 }` | `unique: true` |

#### Relationships / References

- Referenced by Document (`document_type_id`)

#### Special Validation Rules

- Document types are global (not tenant-scoped) — each type has a unique name system-wide

#### Validation Schema (Zod)

From `documentType.validation.js`:
- `createDocumentTypeSchema`: `name` (1–100 chars, required), `description` (max 500, optional)
- `updateDocumentTypeSchema`: `name` (1–100, optional), `description` (max 500, optional)

---

### 15. DocumentChunk

**File:** `server/modules/document/documentChunk.schema.js`  
**Model name:** `DocumentChunk`  
**Collection:** `documentchunks`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `document_id` | ObjectId ref: Document | Yes | — | `index: true` |
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `assigned_role` | String | No | `"All"` | `index: true` |
| `status` | String | No | `"draft"` | `enum: ["draft", "pending", "approved", "rejected"]`, `index: true` |
| `chunk_index` | Number | Yes | — | — |
| `content` | String | Yes | — | — |
| `content_hash` | String | No | — | `index: true` |
| `embedding` | Array of Number | No | `[]` | — |
| `keywords` | Array of String | No | `[]` | — |
| `token_count` | Number | No | `0` | — |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: Only `timestamps.createdAt` is enabled; `updatedAt: false`.

#### Indexes

| Fields | Options |
|---|---|
| `{ document_id: 1 }` | `index: true` (per-field) |
| `{ organization_id: 1 }` | `index: true` (per-field) |
| `{ assigned_role: 1 }` | `index: true` (per-field) |
| `{ status: 1 }` | `index: true` (per-field) |
| `{ content_hash: 1 }` | `index: true` (per-field) |

#### Relationships / References

- `document_id` → Document (chunk belongs to one document)
- `organization_id` → Organization (tenant scoping — denormalized for performance)

#### Special Validation Rules

- Used for RAG (Retrieval-Augmented Generation) — chunks are indexed with vector embeddings
- `content_hash` enables deduplication of chunks
- `chunk_index` preserves ordering within a document
- `embedding` is a vector array for semantic similarity search

---

### 16. DocumentRoleAccess

**File:** `server/modules/document/documentRoleAccess.schema.js`  
**Model name:** `DocumentRoleAccess`  
**Collection:** `documentroleaccesses`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `document_id` | ObjectId ref: Document | Yes | — | `index: true` |
| `role_id` | ObjectId ref: Role | Yes | — | `index: true` |
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: Only `timestamps.createdAt` is enabled; `updatedAt: false`.

#### Indexes

| Fields | Options |
|---|---|
| `{ document_id: 1, role_id: 1 }` | `unique: true` — no duplicate role-document grants |

#### Relationships / References

- `document_id` → Document (the document being shared)
- `role_id` → Role (the role granted access)
- `organization_id` → Organization (tenant scoping)

#### Special Validation Rules

- Acts as a join table for fine-grained role-based document sharing
- Composite unique index prevents duplicate (document, role) pairs

---

### 17. DocumentVerification

**File:** `server/modules/document-verification/documentVerification.schema.js`  
**Model name:** `DocumentVerification`  
**Collection:** `documentverifications`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `document_id` | ObjectId ref: Document | Yes | — | `index: true` |
| `verified_by` | ObjectId ref: User | Yes | — | — |
| `status` | String | No | `"pending"` | `enum: ["pending", "approved", "rejected"]` |
| `remarks` | String | No | — | `maxlength: 1000` |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

None explicitly defined.

#### Relationships / References

- `document_id` → Document (the document being verified)
- `verified_by` → User (the admin who verified it)

#### Validation Schema (Zod)

From `documentVerification.validation.js`:
- `createVerificationSchema`: `document_id` (required), `verified_by` (required), `remarks` (max 1000, optional)
- `rejectVerificationSchema`: `remarks` (1–1000 chars, required)

---

### 18. FAQ

**File:** `server/modules/faq/faq.schema.js`  
**Model name:** `Faq`  
**Collection:** `faqs`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `question` | String | Yes | — | `maxlength: 500` |
| `answer` | String | Yes | — | — |
| `category` | String | No | `"general"` | `maxlength: 100` |
| `status` | String | No | `"draft"` | `enum: ["draft", "pending", "approved", "rejected"]`, `index: true` |
| `is_active` | Boolean | No | `true` | `index: true` |
| `created_by` | ObjectId ref: User | No | — | — |
| `approved_by` | ObjectId ref: User | No | — | — |
| `approved_at` | Date | No | — | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, is_active: 1 }` | — (wait, no — see below) |

> Correction: No explicit compound indexes are declared beyond field-level `index: true` on `organization_id`, `status`, and `is_active`.

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `created_by` → User (who created the FAQ)
- `approved_by` → User (who approved it)

#### Special Validation Rules

- FAQ workflow: `draft` → `pending` → `approved`/`rejected`
- `is_active` controls whether the FAQ is served to end users
- `category` groups related FAQs

#### Validation Schema (Zod)

From `faq.validation.js`:
- `createFaqSchema`: `organization_id` (required), `question` (1–500 chars, required), `answer` (1–5000 chars, required), `is_active` (optional boolean)
- `updateFaqSchema`: all fields optional with same constraints

---

### 19. PromptVersion

**File:** `server/modules/prompt-version/promptVersion.schema.js`  
**Model name:** `PromptVersion`  
**Collection:** `promptversions`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | ObjectId ref: Organization | Yes | — | — |
| `version` | Number | Yes | — | — |
| `system_prompt` | String | Yes | — | — |
| `status` | String | No | `"draft"` | `enum: ["draft", "published", "archived"]` |
| `published_by` | ObjectId ref: User | No | — | — |
| `published_at` | Date | No | — | — |
| `created_by` | ObjectId ref: User | No | — | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, version: -1 }` | — |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `published_by` → User (who published this version)
- `created_by` → User (who created this version)

#### Special Validation Rules

- Version ordering: descending sort on version number within an org for latest-first retrieval
- "published" status means this is the active system prompt for the org
- "archived" versions are no longer available but kept for history

---

### 20. Communication

**File:** `server/modules/communication/communication.schema.js`  
**Model name:** `Communication`  
**Collection:** `communications`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `sender_id` | ObjectId ref: User | Yes | — | `index: true` |
| `receiver_id` | ObjectId ref: User | No | — | `index: true` |
| `organization_id` | ObjectId ref: Organization | No | — | `index: true` |
| `message` | String | Yes | — | `maxlength: 2000` |
| `status` | String | No | `"sent"` | `enum: ["sent", "seen"]`, `index: true` |
| `seen_at` | Date | No | — | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

None explicitly defined beyond field-level indexes.

#### Relationships / References

- `sender_id` → User (who sent the message)
- `receiver_id` → User (who received the message)
- `organization_id` → Organization (tenant scoping)

#### Special Validation Rules

- `status` tracks delivery/read state: `sent` → `seen`
- `seen_at` is set when the receiver reads the message

---

### 21. Notification

**File:** `server/modules/notification/notification.schema.js`  
**Model name:** `Notification`  
**Collection:** `notifications`  
**Plugins:** `tenantPlugin` (injects `organization_id`)

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `title` | String | Yes | — | `maxlength: 255` |
| `message` | String | Yes | — | — |
| `type` | String | No | `"info"` | `enum: ["info", "warning", "success", "error"]` |
| `link` | String | No | — | `maxlength: 500` |
| `is_read` | Boolean | No | `false` | — |
| `organization_id` | ObjectId ref: Organization | Yes (injected) | — | `index: true` (auto) |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: Only `timestamps.createdAt` is enabled; `updatedAt: false`.

#### Indexes

| Fields | Options |
|---|---|
| `{ user_id: 1, is_read: 1, created_at: -1 }` | — |
| `{ organization_id: 1, created_at: -1 }` | auto-injected by tenantPlugin |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `user_id` → User (the recipient)

#### Validation Schema (Zod)

From `notification.validation.js`:
- `createNotificationSchema`: `user_id` (required), `title` (1–255 chars, required), `message` (1–2000 chars, required), `type` (optional enum), `link` (max 500, optional)
- `broadcastNotificationSchema`: `userIds` (non-empty array, required), `title` (1–255, required), `message` (1–2000, required), `type` (optional), `link` (optional)
- `broadcastToOrgSchema`: `title` (1–255, required), `message` (1–2000, required), `type` (optional), `link` (optional)

---

### 22. AuditLog

**File:** `server/modules/audit-log/auditLog.schema.js`  
**Model name:** `AuditLog`  
**Collection:** `auditlogs`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | No | `null` | `index: true` |
| `organization_id` | ObjectId ref: Organization | No | `null` | `index: true` |
| `action` | String | Yes | — | `maxlength: 100` |
| `table_name` | String | Yes | — | `maxlength: 100`, `index: true` |
| `record_id` | String | No | `""` | — |
| `old_value` | Mixed | No | — | — |
| `new_value` | Mixed | No | — | — |
| `created_at` | Date | System | — | Mongoose timestamp |

> Note: Only `timestamps.createdAt` is enabled; `updatedAt: false`.

#### Indexes

| Fields | Options |
|---|---|
| `{ created_at: 1 }` | — |
| `{ user_id: 1 }` | `index: true` (per-field) |
| `{ organization_id: 1 }` | `index: true` (per-field) |
| `{ table_name: 1 }` | `index: true` (per-field) |

#### Relationships / References

- `user_id` → User (the actor; nullable for system actions)
- `organization_id` → Organization (tenant scoping; nullable for global actions)

#### Special Validation Rules

- `old_value` and `new_value` use `Schema.Types.Mixed` to store arbitrary JSON snapshots of changes
- Immutable log — no updates allowed (`updatedAt: false` and `updated_at` not tracked)

---

### 23. KnowledgeGap

**File:** `server/modules/knowledge-gap/knowledgeGap.schema.js`  
**Model name:** `KnowledgeGap`  
**Collection:** `knowledgegaps`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `organization_id` | ObjectId ref: Organization | Yes | — | `index: true` |
| `user_id` | ObjectId ref: User | No | `null` | — |
| `chat_id` | ObjectId ref: Chat | No | `null` | — |
| `query` | String | Yes | — | — |
| `best_score` | Number | No | `0` | — |
| `avg_score` | Number | No | `0` | — |
| `matched_chunks` | Number | No | `0` | — |
| `keywords` | Array of String | No | `[]` | — |
| `topic` | String | No | `"uncategorized"` | `index: true` |
| `status` | String | No | `"unresolved"` | `enum: ["unresolved", "reviewed", "resolved", "dismissed"]`, `index: true` |
| `resolution_note` | String | No | `""` | — |
| `resolved_by` | ObjectId ref: User | No | `null` | — |
| `resolved_at` | Date | No | `null` | — |
| `frequency` | Number | No | `1` | — |
| `last_seen_at` | Date | No | `Date.now` | — |
| `created_at` | Date | No | `Date.now` | `index: true` |

> Note: This schema does NOT use Mongoose `timestamps` — it manually defines `created_at` and has no `updated_at`.

#### Indexes

| Fields | Options |
|---|---|
| `{ organization_id: 1, status: 1 }` | — |
| `{ organization_id: 1, topic: 1 }` | — |
| `{ organization_id: 1, best_score: 1 }` | — |
| `{ query: "text" }` | text index for full-text search on the query string |
| `{ created_at: 1 }` | `index: true` (per-field) |

#### Relationships / References

- `organization_id` → Organization (tenant scoping)
- `user_id` → User (who asked the unanswered question)
- `chat_id` → Chat (which chat contained the unanswered query)
- `resolved_by` → User (who resolved the gap)

#### Special Validation Rules

- Status workflow: `unresolved` → `reviewed` → `resolved` or `dismissed`
- `frequency` tracks how many times a similar gap has been seen
- `last_seen_at` is updated each time the same gap appears (without `updated_at` from timestamps)
- `query` field has a text index for search/analytics
- `best_score` and `avg_score` are RAG similarity scores (0–1 range expected)

---

### 24. GlobalSetting

**File:** `server/modules/global-setting/globalSetting.schema.js`  
**Model name:** `GlobalSetting`  
**Collection:** `globalsettings`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `_id` | String | Yes (as id) | `"global"` | Singleton — always `"global"` |
| `app_name` | String | No | `"SupportAI"` | — |
| `logo.url` | String | No | `""` | — |
| `logo.public_id` | String | No | `""` | — |
| `favicon_url` | String | No | `""` | — |
| `brand_colors.primary` | String | No | `"#2563eb"` | — |
| `brand_colors.secondary` | String | No | `"#7c3aed"` | — |
| `brand_colors.accent` | String | No | `"#f59e0b"` | — |
| `marketing.hero_title` | String | No | `"AI-Powered Customer Support"` | — |
| `marketing.hero_subtitle` | String | No | `"Transform your customer experience with intelligent automation"` | — |
| `marketing.hero_cta_text` | String | No | `"Get Started"` | — |
| `marketing.features_title` | String | No | `"Powerful Features"` | — |
| `marketing.features` | Array of {title, description, icon} | No | `[]` | `icon` defaults to `"bot"` |
| `marketing.footer_text` | String | No | `""` | — |
| `login_page.title` | String | No | `"Welcome Back"` | — |
| `login_page.subtitle` | String | No | `"Sign in to your account"` | — |
| `legal.about_text` | String | No | `""` | — |
| `legal.privacy_policy` | String | No | `""` | — |
| `legal.terms_of_service` | String | No | `""` | — |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

None explicitly defined.

#### Special Validation Rules

- Singleton document pattern: `_id` is always the string `"global"`, ensuring exactly one global settings record
- No tenant plugin — this is a system-wide (non-tenant) configuration collection

#### Validation Schema (Zod)

From `globalSetting.validation.js`:
- `updateGlobalSettingsSchema`: all fields optional with type constraints matching the schema defaults

---

### 25. ChatMemory

**File:** `server/modules/memory/memory.schema.js`  
**Model name:** `ChatMemory`  
**Collection:** `chatmemories`

#### Schema Fields

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `user_id` | ObjectId ref: User | Yes | — | `index: true` |
| `chat_id` | ObjectId ref: Chat | No | — | `index: true` |
| `memory_type` | String | Yes | — | `enum: ["fact", "preference", "summary", "pattern", "context"]`, `index: true` |
| `content` | String | Yes | — | `maxlength: 2000` |
| `keywords` | Array of String | No | `[]` | `lowercase: true`, `trim: true` per element |
| `embedding` | Array of Number | No | `[]` | vector for semantic search |
| `source_messages` | Array of ObjectId ref: Message | No | `[]` | — |
| `confidence` | Number | No | `0.8` | `min: 0`, `max: 1` |
| `access_count` | Number | No | `0` | — |
| `last_accessed_at` | Date | No | — | — |
| `expires_at` | Date | No | — | TTL-indexed |
| `is_active` | Boolean | No | `true` | `index: true` |
| `created_at` | Date | System | — | Mongoose timestamp |
| `updated_at` | Date | System | — | Mongoose timestamp |

#### Indexes

| Fields | Options |
|---|---|
| `{ user_id: 1, memory_type: 1 }` | — |
| `{ user_id: 1, is_active: 1 }` | — |
| `{ user_id: 1, chat_id: 1 }` | — |
| `{ keywords: 1 }` | — |
| `{ expires_at: 1 }` | `expireAfterSeconds: 0` — TTL index for automatic expiration |

#### Relationships / References

- `user_id` → User (the user this memory belongs to)
- `chat_id` → Chat (which conversation this memory originated from)
- `source_messages` → Message (which messages this memory was derived from)

#### Special Validation Rules

- `memory_type` categorizes the kind of memory: `fact`, `preference`, `summary`, `pattern`, or `context`
- `confidence` (0–1) indicates the AI's confidence in the accuracy of the memory
- `expires_at` triggers automatic deletion via MongoDB TTL index
- `access_count` and `last_accessed_at` track memory usage patterns (for eviction policies)
- `embedding` enables semantic search over memories
- `source_messages` maintains provenance — which messages contributed to this memory

#### Validation Schema (Zod)

From `memory.validation.js`:
- `storeMemorySchema`: `user_id` (required), `chat_id` (optional), `memory_type` (required enum), `content` (1–2000 chars, required), `keywords` (string array, optional), `confidence` (0–1, optional), `ttl_days` (1–3650, optional)
- `updateMemorySchema`: all fields optional with same constraints; also allows updating `is_active`

---

## Complete Relationship / Entity Diagram

```
GlobalSetting (singleton, _id="global")
    │
    └── (no relations, system-wide config)

Organization
    ├── owner_id ──────────→ User
    ├── api_keys[]           (embedded)

User (tenant-scoped)
    ├── organization_id ──────→ Organization
    ├── requested_role_id ────→ Role
    ├── role_id ──────────────→ Role
    ├── approved_by ──────────→ User (self-ref)
    ├── UserRole[]
    │     user_id ────────────→ User
    │     role_id ────────────→ Role
    │     organization_id ────→ Organization
    │     assigned_by ────────→ User (self-ref)
    ├── Chat[]
    │     user_id ────────────→ User
    │     assigned_to ────────→ User
    │     organization_id ────→ Organization (via tenantPlugin)
    ├── Message[]
    │     chat_id ────────────→ Chat
    │     sender_id ──────────→ User
    ├── Ticket[]
    │     user_id ────────────→ User
    │     assigned_to ────────→ User
    │     resolved_by ────────→ User
    │     closed_by ──────────→ User
    │     escalated_from_chat.chat_id ──→ Chat
    │     organization_id ────→ Organization (via tenantPlugin)
    ├── Document[]
    │     user_id ────────────→ User
    │     document_type_id ───→ DocumentType
    │     approved_by ────────→ User
    │     organization_id ────→ Organization (via tenantPlugin)
    ├── Notification[]
    │     user_id ────────────→ User
    │     organization_id ────→ Organization (via tenantPlugin)
    ├── RefreshSession[]
    │     user_id ────────────→ User
    │     organization_id ────→ Organization
    ├── RegistrationRequest[]
    │     user_id ────────────→ User
    │     organization_id ────→ Organization
    │     requested_role_id ──→ Role
    │     approved_by ────────→ User
    ├── ChatMemory[]
    │     user_id ────────────→ User
    │     chat_id ────────────→ Chat
    │     source_messages[] ───→ Message
    ├── DocumentVerification[]
    │     verified_by ────────→ User
    ├── KnowledgeGap[]
    │     user_id ────────────→ User
    │     chat_id ────────────→ Chat
    │     resolved_by ────────→ User
    ├── Communication[]
    │     sender_id ──────────→ User
    │     receiver_id ────────→ User
    ├── AISession[]
    │     chat_id ────────────→ Chat
    ├── PromptVersion[]
    │     organization_id ────→ Organization
    │     published_by ───────→ User
    │     created_by ─────────→ User
    ├── AuditLog[]
    │     user_id ────────────→ User
    │     organization_id ────→ Organization
    └── FAQ[]
          organization_id ────→ Organization
          created_by ────────→ User
          approved_by ───────→ User

Role (global or org-scoped)
    ├── organization_id ──────→ Organization (null = global)

DocumentType (global)
    └── (referenced by Document.document_type_id)

Document (tenant-scoped)
    ├── organization_id ──────→ Organization (via tenantPlugin)
    ├── user_id ──────────────→ User
    ├── document_type_id ─────→ DocumentType
    ├── approved_by ──────────→ User
    └── DocumentChunk[]
          document_id ────────→ Document
          organization_id ────→ Organization
    └── DocumentRoleAccess[]
          document_id ────────→ Document
          role_id ────────────→ Role
          organization_id ────→ Organization
    └── DocumentVerification[]
          document_id ────────→ Document
          verified_by ────────→ User

TicketTemplate (org-scoped)
    ├── organization_id ──────→ Organization

TicketMessage
    ├── ticket_id ────────────→ Ticket
    └── sender_id ────────────→ User
```

---

## Summary by Collection

| # | Model | Collection | Tenant-Scoped? | Uses tenantPlugin? |
|---|---|---|---|---|
| 1 | Organization | organizations | No (top-level tenant) | No |
| 2 | User | users | Yes | Yes |
| 3 | Role | roles | Optional (global or per-org) | No |
| 4 | UserRole | userroles | Yes | No |
| 5 | RefreshSession | refreshsessions | Yes | No |
| 6 | RegistrationRequest | registrationrequests | Yes | No |
| 7 | Chat | chats | Yes | Yes |
| 8 | Message | messages | No | No |
| 9 | AISession | aisessions | No | No |
| 10 | Ticket | tickets | Yes | Yes |
| 11 | TicketMessage | ticketmessages | No | No |
| 12 | TicketTemplate | tickettemplates | Yes | No |
| 13 | Document | documents | Yes | Yes |
| 14 | DocumentType | documenttypes | No (global) | No |
| 15 | DocumentChunk | documentchunks | Yes | No |
| 16 | DocumentRoleAccess | documentroleaccesses | Yes | No |
| 17 | DocumentVerification | documentverifications | No | No |
| 18 | Faq | faqs | Yes | No |
| 19 | PromptVersion | promptversions | Yes | No |
| 20 | Communication | communications | Yes | No |
| 21 | Notification | notifications | Yes | Yes |
| 22 | AuditLog | auditlogs | Yes | No |
| 23 | KnowledgeGap | knowledgegaps | Yes | No |
| 24 | GlobalSetting | globalsettings | No (system-wide) | No |
| 25 | ChatMemory | chatmemories | No | No |

---

## Seed Data Summary

### `server/seed.js`

Seeds the following into the default organization (`organization_id: "DEFAULT"`):

1. **Default Organization:**
   - `organization_id: "DEFAULT"`
   - `name: "Default Organization"`
   - `email: "default@supportai.com"`
   - `phone: "000-0000"`
   - `status: "active"`
   - `domain: ""`

2. **Standard Roles (global, organization_id = null):**
   - Super Admin — permissions: `["*"]`
   - Admin — full permission set
   - Support — support agent permissions
   - Customer — customer permissions

3. **Super Admin User:**
   - `email: "superadmin@supportai.com"` (configurable via env)
   - `password: "Super@123"` (configurable via env, bcrypt-hashed)
   - `name: "Super Admin"` (configurable via env)
   - `auth_type: "local"`
   - `status: "active"`
   - `email_verified: true`
   - `organization_id: <default org _id>`

4. **UserRole assignment:** Super Admin user → Super Admin role, in default org.

5. **Per-org roles** are created automatically via `createDefaultRolesForOrganization` when an org is ensured:
   - Organization Admin
   - Support
   - Customer

### `server/scripts/seedRBAC.js`

Runs `initializeRoles()` from `role.service.js`:

- Ensures the 4 standard global roles exist (Super Admin, Admin, Support, Customer)
- If they already exist, syncs permissions with the current permission registry
- Marks Super Admin as `isSystemRole: true`
- Does NOT seed organizations, users, or UserRole assignments
- Permissions are code-driven (defined in `server/utils/permissions.js`) — never stored separately in the DB
