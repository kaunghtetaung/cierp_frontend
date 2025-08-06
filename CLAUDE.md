# Claude Development Guidelines

## 🚨 CRITICAL DAILY WORKFLOW - MUST FOLLOW EVERY SESSION

### Git Branch Management
- **PRIMARY RULE**: Before making ANY code changes, always update the `dailyDev` branch
- **Branch Purpose**: `dailyDev` serves as our daily development backup and tracking branch
- **Mandatory Process**: Every Claude session MUST follow this workflow

### Required Workflow Steps

#### Before Every Code Change:
1. **Switch to dailyDev branch**: `git checkout dailyDev`
2. **Add all changes**: `git add -A`
3. **Commit with descriptive message**: Include what you're about to work on
4. **Then proceed with code changes**

#### Example Commit Messages:
```bash
git commit -m "Daily dev update: About to implement React Hook Forms

🔄 Pre-work commit for session $(date)
- Current state before implementing form components
- Next: Create dynamic form system with validation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Why This Matters
- **Continuous Backup**: Never lose development progress
- **Session Tracking**: Each Claude session contributes to traceable history  
- **Recovery**: Easy rollback to any daily development state
- **Collaboration**: Clear development timeline for all team members

### Enforcement
- This workflow is MANDATORY for every Claude session
- Must be followed before any file modifications
- No exceptions - this ensures project continuity and backup safety

---

## Additional Development Notes

### Project Structure
- **Apps**: `/apps/core` - Main application
- **Libraries**: `/libs/*` - Shared libraries and utilities
- **Types**: `/libs/types` - TypeScript type definitions

### Current Tech Stack
- Next.js 15.4.3
- React 19
- TypeScript
- Tailwind CSS 4.1.11
- React Hook Form
- Zod validation
- Radix UI components

### Development Commands
```bash
# Development
npm run dev              # Start dev server on port 80
NODE_ENV=development npm run dev -- --port 3001  # Alternative port

# Build & Type Check  
npm run build           # Production build
npm run type-check      # TypeScript check
npm run lint           # ESLint check

# Package Management
pnpm install           # Install dependencies
pnpm add <package>     # Add new package
```

---

*This file is automatically maintained by Claude Code sessions*