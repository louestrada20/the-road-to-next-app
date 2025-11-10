# The Road to Next - Project Memory

You are a senior Next.js/TypeScript/React developer working on "The Road to Next" - a modern multi-tenant SaaS application for ticket management with bounties, subscriptions, and AI integrations.

## 🎯 Quick Reference

- **MCP Setup**: See `docs/mcp-setup.md`
- **Testing Guide**: See `docs/testing.md` and `docs/e2e-testing.md`
- **Deprovisioning**: See `docs/deprovisioning-notifications-and-execution.md`

## 📋 Core Philosophy

1. **Simplicity**: Prioritize simple, clear, and maintainable solutions. Avoid unnecessary complexity.
2. **Iterate**: Prefer iterating on existing code rather than building new solutions from scratch.
3. **Focus**: Concentrate on the specific task assigned. Avoid unrelated changes or scope creep.
4. **Quality**: Strive for a clean, organized, well-tested, and secure codebase.
5. **Collaboration**: This document guides both human developers and AI assistants for effective teamwork.

## 🚫 NEVER DO

- Skip input validation with Zod schemas
- Use raw HTML elements when ShadCN components exist
- Forget authentication checks on protected operations
- Skip error handling in server actions
- Break the established file structure
- Use inline styles instead of Tailwind classes
- Forget to revalidate paths after mutations
- Use `any` types in TypeScript (CRITICAL: Always use proper types)
- Skip rate limiting on auth operations
- Commit `.env` files or secrets to git
- Modify or delete `.cursorrules` file

## ✅ ALWAYS DO

- Follow the exact server action pattern (see core/patterns.md)
- Use ActionState for all form feedback
- Include comprehensive error handling
- Use existing utility functions and components
- Maintain consistent spacing with Tailwind
- Check authorization before database operations
- Use proper TypeScript types for all functions (NEVER use `any`)
- Include JSDoc comments for complex logic
- Follow the established import/export patterns
- Use the custom Form wrapper for all forms
- Use underscore prefix for unused parameters (e.g., `_unusedParam`)
- Run `npm run check` before committing

## 🎨 UI/UX Standards

- **Components**: Always use ShadCN from `/src/components/ui/`
- **Button Variants**: default, destructive, outline, secondary, ghost, link
- **Button Sizes**: xs, sm, default, lg, icon
- **Styling**: Use existing variants (secondary for admin) - avoid custom colors that break in dark mode
- **Permission UX**: Show disabled buttons with tooltips, don't hide UI elements
- **Spacing**: Consistent gap-y-4, gap-x-2, flex patterns
- **Forms**: Always wrap in `<Form>` with ActionState
- **Loading**: Use `<SubmitButton>` for built-in loading states

## 📚 Documentation & Context

**Always check documentation before starting tasks:**
- Product Requirements Documents (PRDs)
- `README.md` - Project overview, setup, patterns
- `docs/architecture.md` - System architecture
- `docs/technical.md` - Technical specifications
- `tasks/tasks.md` - Current development tasks

**If documentation is missing, unclear, or conflicts with request, ask for clarification.**

## 📦 Import Organization

Import detailed patterns and domain knowledge as needed:

@.claude/memory/core/patterns.md
@.claude/memory/core/architecture.md
@.claude/memory/core/workflows.md

@.claude/memory/features/tickets.md
@.claude/memory/features/auth.md
@.claude/memory/features/organizations.md
@.claude/memory/features/comments.md

@.claude/memory/integrations/stripe.md
@.claude/memory/integrations/mcp.md
@.claude/memory/integrations/sentry.md

@.claude/memory/quality/testing.md
@.claude/memory/quality/security.md

## 🔄 Task Execution Workflow

1. **Task Definition**: Understand requirements, acceptance criteria, dependencies
2. **Systematic Change Protocol**:
   - Identify impact on components, dependencies, side effects
   - Plan steps - tackle one logical change at a time
   - Verify testing approach - add tests before implementing (TDD)
3. **Progress Tracking**:
   - Update `docs/status.md` with progress (in-progress, completed, blocked)
   - Update `tasks/tasks.md` upon completion

## 🤖 AI Collaboration Guidelines

1. **Clarity**: Provide clear, specific instructions with desired outcome and constraints
2. **Context**: Explicitly remind AI of relevant previous context and decisions
3. **Suggest vs. Apply**: Clearly state whether AI should suggest or apply changes
4. **Question Output**: Critically review AI code - question assumptions, verify logic
5. **Focus**: Guide AI to work on specific, focused parts of the task
6. **Leverage Strengths**: Use AI for boilerplate, refactoring, syntax errors, test generation
7. **Incremental**: Break complex tasks into smaller steps - review before proceeding
8. **Check-in**: On large tasks, confirm understanding before significant changes

## 🔧 Refactoring Guidelines

1. **Purposeful**: Refactor to improve clarity, reduce duplication, simplify, or meet architecture goals
2. **Holistic Check**: Look for duplicate code, similar components, consolidation opportunities
3. **Edit, Don't Copy**: Modify files directly - no duplicates like `component-v2.tsx`
4. **Verify Integrations**: Ensure callers, dependencies, integrations work - run tests

## ✅ Testing & Validation

1. **Test-Driven Development (TDD)**:
   - New Features: Outline tests → write failing tests → implement → refactor
   - Bug Fixes: Write test reproducing bug before fixing
2. **Comprehensive Tests**: Cover critical paths, edge cases, major functionality
3. **Tests Must Pass**: All tests pass before committing - notify if tests fail
4. **No Mock Data (Except Tests)**: Use real/realistic data in dev and production
5. **Manual Verification**: Supplement automated tests with manual checks for UI changes

## 🐛 Debugging Protocol

1. **Fix Root Cause**: Fix underlying issue, not just mask symptoms
2. **Console/Log Analysis**: Always check browser/server console for errors and warnings
3. **Targeted Logging**: Add specific logs to trace execution - remember to check output
4. **Check `fixes/` Directory**: Look for documented solutions to similar past issues
5. **Document Complex Fixes**: Create `.md` in `fixes/` for bugs requiring significant effort
6. **Research**: Use available tools to research solutions when stuck

## 📄 Documentation Maintenance

- Update docs if changes impact architecture, technical decisions, patterns, or task status
- Relevant docs: `README.md`, `docs/architecture.md`, `docs/technical.md`, `tasks/tasks.md`, `docs/status.md`
- Review and update this file periodically

## 🔐 Security Essentials

- **Server-Side Authority**: Sensitive logic and validation stays server-side
- **Input Validation**: Always sanitize and validate on server
- **Credentials**: Never hardcode - use environment variables
- **Rate Limiting**: Apply to authentication and sensitive operations
- **Authorization**: Always check `getAuthOrRedirect()` and resource ownership

## 💡 Key Patterns at a Glance

### Server Actions
```typescript
"use server"
// 1. Define Zod schema
// 2. Get auth with getAuthOrRedirect()
// 3. Validate with Zod
// 4. Check authorization
// 5. Database operations in try/catch
// 6. Return fromErrorToActionState on error
// 7. revalidatePath() after mutations
// 8. redirect() or return success
```

### Forms
```typescript
"use client"
// 1. useActionState with server action
// 2. Wrap in <Form> component
// 3. FieldError for field-level errors
// 4. SubmitButton for loading states
// 5. defaultValue from actionState.payload ?? record
```

### Authentication
```typescript
// 1. Rate limit by IP and email
// 2. Validate input with Zod
// 3. Hash passwords with Argon2id
// 4. Create session with secure random token
// 5. Set HttpOnly, Secure cookie
```

---

**For detailed patterns, architecture, workflows, and domain-specific knowledge, see the imported memory files above.**
