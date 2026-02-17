# Documentation

This folder contains all project documentation for the **Design Token Compiler**.

---

##  Documentation Files

### [PROJECT-PROGRESS.md](./PROJECT-PROGRESS.md)
**Complete project status and roadmap**
-  What's been completed
- 🚧 What's in progress
- ⬜ What's not started
- Feature checklist by phase
- Technical architecture overview
- Known issues and next steps

**Read this for:** Understanding overall project status and what to build next.

---

### [GETTING-STARTED.md](./GETTING-STARTED.md)
**User guide for current build**
- How to run the app
- How to use the compiler
- Understanding sample tokens
- Token reference syntax
- Output examples (CSS, TypeScript, Tailwind)
- Troubleshooting guide

**Read this for:** Learning how to use what's already built.

---

##  Quick Reference

### Project Overview
**What:** Web-based design token compiler
**Why:** Solve the $58,500/month design-code drift problem
**How:** One token set → multi-format compilation → automatic sync

### Current Status
- **Phase 1 Foundation:**  100% Complete
- **Phase 2 Compilers:**  75% Complete (3 of 7 formats)
- **Overall Project:** ~30% Complete

### What Works Now
 Token resolution engine (tested)
 CSS, TypeScript, Tailwind compilers
 Light/Dark theme support
 Copy, download, ZIP export
 Sample token set

### What Doesn't Work Yet
⬜ Token editor UI
⬜ Figma sync and diff
⬜ Visual token browser
⬜ Import from files
⬜ Versioning

### Running the App
```bash
npm run dev
# Opens at http://localhost:5174/
```

---

##  Additional Resources

### Source Files
- **Spec:** `design-token-compiler.md` (root) — Visual design spec
- **PRD:** `design-token-compiler-PRD.md` (root) — Product requirements

### Key Source Code
- **Resolver:** `src/lib/resolver.ts` — Token resolution engine
- **Compilers:** `src/lib/compilers/` — CSS, TypeScript, Tailwind
- **Store:** `src/store/useTokenStore.ts` — State management
- **Types:** `src/types/index.ts` — TypeScript definitions

---

##  Documentation Updates

**Last Updated:** February 16, 2026

**Update Frequency:**
- Update PROJECT-PROGRESS.md after completing major features
- Update GETTING-STARTED.md when user-facing functionality changes
- Add new docs as needed for complex features

---

##  Contributing to Docs

When adding or modifying features:

1. **Update PROJECT-PROGRESS.md**
   - Mark completed features with 
   - Update completion percentages
   - Add new features to roadmap if needed

2. **Update GETTING-STARTED.md** (if user-facing)
   - Add usage instructions
   - Include examples
   - Update troubleshooting section

3. **Keep Docs in Sync**
   - Don't let docs lag behind code
   - Document decisions as you make them
   - Include code examples for complex features

---

##  Learning Path

**New to the project?** Read in this order:

1. **`design-token-compiler-PRD.md`** (root)
   - Understand the problem and solution
   - Learn the competitive landscape
   - Review the full vision

2. **`design-token-compiler.md`** (root)
   - Understand the visual design language
   - Review the build phases
   - See the technical stack

3. **`GETTING-STARTED.md`** (this folder)
   - Run the app
   - Try the compiler
   - Understand how it works

4. **`PROJECT-PROGRESS.md`** (this folder)
   - See what's built
   - Review what's next
   - Pick a feature to work on

5. **Source Code**
   - Start with `src/lib/resolver.ts` (core logic)
   - Then `src/lib/compilers/` (see the pattern)
   - Then `src/pages/CompilerView.tsx` (see the UI)

---

##  Quick Links

- **Dev Server:** http://localhost:5174/
- **Repository:** (Add GitHub URL when created)
- **Deployed App:** (Add Vercel URL when deployed)
- **Figma Spec:** (Add if applicable)

---

**Questions?** Check the troubleshooting section in GETTING-STARTED.md first.
