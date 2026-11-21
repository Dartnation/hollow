# Instructions to development agents — Hollow

- **Scope:** Work ONLY in the Hollow project and `Dartnation/hollow`. Do not modify SktAgnes, The Last Light, or any other repository/workspace.
- **Source of truth:** Read `README.md`, `docs/GAME_DESIGN_V1.md`, `docs/MISSION_V1.md`, `docs/MONSTER_AI_V1.md`, and `docs/ACCEPTANCE_TESTS_V1.md` before implementation.
- **Roles:** ChatGPT is creative director/designer and independent reviewer; Cursor is lead implementation agent; the human owner approves each version. Do not fabricate approvals or claim AI-to-AI communication occurred if it did not.
- **Branching:** Keep `main` stable. Implement in `feature/v1-vertical-slice` (or smaller branches); open PR(s), include summary, tests, visuals, and known limitations. Never force-push shared main.
- **Safety:** Public repo. Never commit API keys, passwords, tokens, credentials, private content, local paths containing identities, or unlicensed assets. Add `.gitignore`; use `.env.example` only for placeholders.
- **Environment:** New project folder; no assumption that localhost port 5183 is free. Read before changing. No import from other games without explicit approval.
- **Quality:** A design request is not proof of implementation. Supply executable test commands, actual outputs, screenshots, and reproducible scenario/seed for every PR. Do not claim photorealism from primitives.
- **Scope control:** Implement V1 only; defer additional houses, multiple monsters, huge terrain, multiplayer, full-story branches, and desktop packaging.
- **User review:** At the end, prepare a short playtest guide. Don't advance to V2 until owner provides feedback.
