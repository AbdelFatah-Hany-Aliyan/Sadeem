# SADEEM COMPANY MANAGEMENT SYSTEM — INVITATION & ACTIVATION WORKFLOW

**Implementation:** `src/lib/services/invitationService.ts`, `src/lib/services/companyMemberService.ts`  
**Public Routes:** `/join/invitation/[token]`, `/join/activate/[token]`  

---

## 1. Multi-Step State Machine

The invitation lifecycle enforces a multi-step verification sequence designed to prevent unauthorized account creation, email enumeration, link crawler side-effects, and credential exposure.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Sadeem Administrator
    actor Candidate as Invited Candidate
    participant Server as Next.js Server & Services
    participant DB as PostgreSQL Database
    participant Mail as Email Outbox / Resend

    Note over Admin,Mail: Phase 1 — Creation & Dispatch
    Admin->>Server: createMemberAction(data, sendInvite=true)
    Server->>DB: Insert CompanyMember (status: PENDING_INVITATION)
    Server->>Server: Generate 32-byte crypto token & SHA-256 hash
    Server->>DB: Insert MemberInvitation (status: PENDING, expires: 7d)
    Server->>DB: Update CompanyMember (status: INVITED)
    Server->>Mail: Queue/Send Invitation Email (link: /join/invitation/{rawToken})
    Mail-->>Candidate: Delivery of branded Arabic email

    Note over Candidate,Server: Phase 2 — Candidate Response (GET safe, POST mutation)
    Candidate->>Server: GET /join/invitation/{rawToken}
    Server->>DB: Verify tokenHash (Read-only, NO state mutation)
    Server-->>Candidate: Render Candidate details & Decision buttons
    Candidate->>Server: POST acceptInvitationAction({token})
    Server->>DB: Atomically set MemberInvitation (status: ACCEPTED)
    Server->>DB: Atomically set CompanyMember (status: ACCEPTED)
    Server->>DB: Create CompanyNotification (INVITATION_ACCEPTED) for Admins
    Server-->>Candidate: Confirmation page ("Awaiting Manager Review")

    Note over Admin,DB: Phase 3 — Administrative Review & Approval
    Admin->>Server: GET /admin/company/invitations
    Admin->>Server: POST approveMemberAction({memberId, adminRole})
    Server->>DB: Update CompanyMember (status: APPROVED)
    Server->>DB: Provision AdminUser (isActive: false)
    Server->>Server: Generate 32-byte activation token & SHA-256 hash
    Server->>DB: Insert AccountActivationToken (expires: 24h)
    Server->>Mail: Send Activation Email (link: /join/activate/{rawActivationToken})

    Note over Candidate,Server: Phase 4 — Password Creation & Activation
    Candidate->>Server: GET /join/activate/{rawActivationToken}
    Server->>DB: Verify activation token (valid & not consumed)
    Server-->>Candidate: Render Password Setup form
    Candidate->>Server: POST activateAccountAction({password})
    Server->>Server: Hash password with bcrypt (salt rounds = 10)
    Server->>DB: In a transaction: Mark token consumedAt = now()
    Server->>DB: Set AdminUser (passwordHash, isActive = true)
    Server->>DB: Set CompanyMember (status = ACTIVE)
    Server-->>Candidate: Success! Redirect to /admin/login
```

---

## 2. Key Security Properties

### Cryptographic Token Storage
- Plaintext tokens are **never stored in the database**.
- Each link contains a 32-byte cryptographically random hex string (`crypto.randomBytes(32).toString("hex")`).
- The database stores only the `SHA-256` digest:
  $$\text{tokenHash} = \text{SHA-256}(\text{rawToken})$$
- Even in the event of an unauthorized database read, tokens cannot be forged or redeemed.

### Idempotency & Single-Use Enforcement
- **GET Safety:** Visiting `/join/invitation/[token]` executes a strictly read-only check (`verifyInvitationToken`). Link preview bots, antivirus scanners, and crawler pre-fetching do NOT trigger state changes.
- **Single-Use Activation:** `AccountActivationToken` has an atomic guard:
  `if (activationRecord.consumedAt !== null) throw new Error("ALREADY_USED");`
  Subsequent redemption attempts are rejected immediately.

### Absolute Deny on Expired Tokens
- Invitation links expire after 7 days by default.
- Activation links expire after 24 hours.
- Expired links cannot be redeemed under any condition.
