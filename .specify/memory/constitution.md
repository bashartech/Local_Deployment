<!-- SYNC IMPACT REPORT
Version change: 1.0.0 → 1.1.0
Modified principles:
- Principle 1: Phase Continuity Rule
- Principle 2: Spec-Driven Development (Mandatory)
- Principle 3: Stateless Architecture
- Principle 4: Separation of Responsibilities
- Principle 5: Database Usage Rules
- Principle 6: Authentication & User Isolation
Added sections: MCP & AI Constraints, Technology Stack
Removed sections: None
Templates requiring updates:
- .specify/templates/plan-template.md ⚠ pending
- .specify/templates/spec-template.md ⚠ pending
- .specify/templates/tasks-template.md ⚠ pending
Follow-up TODOs: None
-->
# Todo AI Chatbot Constitution

## Core Principles

### Phase Continuity Rule
Phase 3 is a continuation and extension of Phase 2 — NOT a rewrite. Phase 2 codebase must be reused, existing database schema for tasks must not be recreated, authentication and authorization logic must remain unchanged, and Phase 3 features are added incrementally and safely. Do NOT create the application from scratch, duplicate task tables or models, or bypass existing auth logic. Instead, extend Phase 2 with AI, MCP, and chat capabilities.

### Spec-Driven Development (Mandatory)
All work in Phase 3 must follow this strict order: 1. Write a specification, 2. Validate the specification, 3. Create an execution plan, 4. Break the plan into atomic tasks, 5. Inspect existing codebase (file & folder structure), 6. Implement changes, 7. Test and validate, 8. Fix errors before proceeding. No implementation is allowed without an approved spec.

### Stateless Architecture
No backend service holds in-memory state between requests. Conversation context is persisted in the database. MCP tools are fully stateless. This guarantees scalability, resilience, and reproducibility.

### Separation of Responsibilities
Frontend handles UI, ChatKit, and user interaction. FastAPI Backend manages auth, chat orchestration, and conversation storage. AI Agent performs reasoning and decision-making. MCP Server handles task operations only. Database provides persistent state.

### Database Usage Rules
A single Neon PostgreSQL database is used. Existing Task table from Phase 2 is reused as-is. Phase 3 introduces only Conversation and Message tables. The tasks table is accessed by MCP Server, conversations by FastAPI Chat Backend, and messages by FastAPI Chat Backend.

### Authentication & User Isolation
All requests are authenticated using JWT. user_id is extracted from verified tokens. AI and MCP tools act on behalf of the authenticated user. MCP tools must always scope DB queries by user_id. At no point may AI or MCP tools bypass authentication.

## Additional Constraints

### MCP & AI Constraints
MCP Server must be stateless with no conversation memory, no authentication logic, and only task operations. AI Agent has no direct database access, uses MCP tools exclusively, and has behavior defined by spec.

### Technology Stack
Frontend: OpenAI ChatKit, Next.js, Tailwind CSS. Backend: FastAPI, OpenAI Agents SDK, Official MCP SDK. Database & ORM: Neon Serverless PostgreSQL, SQLModel. Authentication: Better Auth, JWT.

## Development Workflow

### Enforcement Rule
Any future spec, task, or code that violates this constitution must be rejected or refactored before proceeding. This constitution is binding for all Phase 3 development work. Phase 3 builds intelligence on top of a solid system, not beside it and not instead of it.

## Governance

This constitution defines the foundational rules, boundaries, and guiding principles for Phase 3 of the Hackathon II Todo Application. This document ensures that all future specifications, plans, tasks, and implementations remain consistent with prior work, do not re-implement or break Phase 2, follow Spec-Driven Development (SDD), and adhere strictly to hackathon requirements. This file acts as the single source of truth for architectural and process decisions in Phase 3. All PRs/reviews must verify compliance.

**Version**: 1.1.0 | **Ratified**: 2026-01-07 | **Last Amended**: 2026-01-07