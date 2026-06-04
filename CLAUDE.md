@AGENTS.md

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/office-hours` — describe what you're building, get product/eng guidance
- `/plan-ceo-review` — review a feature idea from a CEO/product perspective
- `/plan-eng-review` — engineering review of a plan
- `/plan-design-review` — design review of a plan
- `/design-consultation` — design consultation session
- `/design-shotgun` — generate multiple design directions
- `/design-html` — build an HTML prototype
- `/review` — code review the current branch
- `/ship` — prepare and open a PR
- `/land-and-deploy` — land the PR and deploy
- `/canary` — canary deploy
- `/benchmark` — benchmark the current code
- `/browse` — web browsing (use this instead of MCP browser tools)
- `/connect-chrome` — connect to a running Chrome instance
- `/qa` — QA test a URL in a real browser
- `/qa-only` — run QA tests only (no setup)
- `/design-review` — review the UI/UX of a feature
- `/setup-browser-cookies` — set up browser cookies for QA
- `/setup-deploy` — configure deployment
- `/setup-gbrain` — set up gbrain integration
- `/retro` — run a retrospective
- `/investigate` — investigate a bug or issue
- `/document-release` — generate release notes
- `/document-generate` — generate documentation
- `/codex` — OpenAI Codex-style task execution
- `/cso` — security audit (OWASP + STRIDE)
- `/autoplan` — auto-generate an implementation plan
- `/plan-devex-review` — developer experience review of a plan
- `/devex-review` — developer experience review
- `/careful` — extra-careful mode for risky changes
- `/freeze` — freeze the codebase (no changes)
- `/guard` — guard the codebase against regressions
- `/unfreeze` — unfreeze the codebase
- `/gstack-upgrade` — upgrade gstack to the latest version
- `/learn` — learn a new skill or concept

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
