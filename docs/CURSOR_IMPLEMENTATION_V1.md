# HOLLOW V1 — Cursor implementation handoff

Du er **Lead Game Developer** for det nye spil i `Dartnation/hollow`. ChatGPT er Creative Director og reviewer. Ejeren tester og godkender.

## Før du koder
1. Bekræft at `git remote -v` peger på `https://github.com/Dartnation/hollow.git`.
2. Arbejd i ny isoleret projektmappe. Rør ikke SktAgnes, The Last Light eller andre projekter.
3. Læs `AGENTS.md`, `docs/GAME_DESIGN_V1.md`, `docs/MISSION_V1.md`, `docs/MONSTER_AI_V1.md`, `docs/LEVEL_LAYOUT_V1.md`, `docs/VISUAL_DIRECTION_V1.md`, `docs/AI_WORKFLOW.md` og `docs/ACCEPTANCE_TESTS_V1.md`.
4. Opret en ny udviklingsgren, fx `feature/v1-vertical-slice`; ændr ikke `main` direkte.
5. Planlæg milepæle og begræns scope til første vertical slice.

## Stack
- TypeScript strict, Babylon.js, Vite, Web Audio API/MP3-manifest, Playwright.
- Lokal udviklingsport 5183 foreslås, men skal kunne konfigureres og må ikke konfliktere med andre services.
- Python valgfrit til værktøjer; ingen C++ eller game-engine-skift uden verificeret behov.
- Ingen licensbeskyttede eksterne assets, secrets eller private data i public repo.

## Implementeringsrækkefølge
1. Minimal, kørbar browserapp med build/test og brugbar fejlrapportering.
2. First-person controller, fysik/kollisioner, interaktionssystem, lommelygte og UI.
3. Kompakt, læsbar og stemningsfuld skov med to særskilte ruter.
4. Skovfogedhytte med fysisk spilbare rum, døre, radio, elpanel og generatorskur.
5. Mission M01 som state machine, power- og radio-interaktion, checkpoints og save/load.
6. Vogteren: fair hørelse/syn, sidste kendte position, navigation, undersøgelse, jagt og tab af kontakt.
7. Web Audio API, MP3-baseret positioneret lyd, undertekster og afslutning.
8. Faktiske automatiserede tests, visuelle screenshots og QA/performancemålinger.

## Aflevering
Opret en **draft pull request** med commit-SHA, ændringsoversigt, startkommando, screenshots, testkommandoer og faktisk PASS/FAIL/SKIPPED-output. Dokumentér kendte fejl, designafvigelser og spiltestvejledning. Sæt ikke V1 til godkendt uden ejerens spiltest.

Når V1 er spilbar, send PR'en til ChatGPT for review og til ejeren for spiltest. Ingen automatisk videreudvikling til V2.
