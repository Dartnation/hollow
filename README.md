# HOLLOW — Game Design V1: Den første nat

**Projekt:** `Dartnation/hollow` · **Status:** Design V1; **spilkode endnu ikke implementeret** · **Arbejdstitel:** Hollow

Hollow er et selvstændigt, browserbaseret first-person survival-horrorspil. Det foregår i en mørk skov med få, men meningsfulde bygninger, en intelligent trussel og missioner, der ændrer verdenen. Det er **ikke** SktAgnes eller The Last Light.

## V1: Spilbar vertical slice

Designmålet er en cirka 10–15 minutters oplevelse med titlen **Det sidste signal**: ankomst, valg mellem to skovruter, et skovfogedhus med et meningsfuldt strømvalg, et radiosignal, et væsen der reagerer på lyd, og en dramatisk afslutning. Ingen tilfældige saml-opgaver.

## Samarbejde

**ChatGPT designer Vn → Cursor implementerer Vn → Projektejeren spiller og tester Vn → ChatGPT designer Vn+1.**

- ChatGPT: Creative Director, missionsdesign, teknisk/visuelt review.
- Cursor: programmering, 3D, gameplay, faktiske tests og screenshots.
- Ejer: endelig accept eller afvisning af hver version.

Læs `AGENTS.md` og `docs/AI_WORKFLOW.md`, når de er tilgængelige. Implementering foregår i separat gren med PR. Ingen ændringer i andre spil.

## Teknisk udgangspunkt

TypeScript (strict) + Babylon.js + Vite, Web Audio API til MP3, Python kun til hjælpescripts, Playwright til browser-tests. Udviklingsport 5183 foreslås, men skal være konfigurerbar og må ikke forstyrre andre lokale projekter.

## Offentlig kode

Dette repository er **public**. Commit aldrig passwords, API-nøgler, tokens, personlige data eller assets uden rettigheder.

## Ærlig status

V1 er implementeret på `feature/v1-vertical-slice` og er ikke godkendt. V2.1 ligger på `feature/v2.1-forest-graphics`. V2.1R ligger på `feature/v2.1r-forest-revision`. V2.1S, det næste visuelle forsøg med nålekort og slukket lyd, ligger på `feature/v2.1s-clean-forest` og er ikke godkendt. Se `docs/V2_1S_FOREST.md`.

Start lokalt med `npm install` og `npm run dev`. Standardporten er 5183 og kan ændres med `PORT` eller `vite --port`. Spilvejledning og testresultater ligger i `docs/PLAYTEST_V1.md` og `docs/V1_STATUS.md`. Grafikken er procedural og stemningsfuld, ikke fotorealistisk.
