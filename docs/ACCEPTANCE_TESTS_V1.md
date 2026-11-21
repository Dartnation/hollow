# HOLLOW V1 — Acceptance tests

## Obligatoriske kriterier
- [ ] `npm install`, `npm run dev`, `npm run build` og relevante tests lykkes, med dokumenteret output.
- [ ] Lokalhost-port er konfigurerbar uden at påvirke andre projekter.
- [ ] First-person kontrol virker: WASD, mus, løb, duk, E-interaktion, lommelygte og kollision.
- [ ] To gennemførlige skovruter har tydelig forskel i afstand, støj og skjul.
- [ ] Hytten er proportioneret, indvendigt spilbar og har virkende dør, radio og elpanel.
- [ ] Radiosender og sikkerhedslys kan ikke være tændt samtidigt; skiftet påvirker grafik og gameplay.
- [ ] Frekvens-puzzle har fair auditiv/visuel feedback.
- [ ] Mission M01 har alle tilstande og kan fuldføres med slutsekvens.
- [ ] Monsteret reagerer på registreret lyd og synslinje, ikke skjult perfekt spillerposition.
- [ ] Monsteret kan miste spilleren, søge, genfinde vej og afslutte jagt.
- [ ] Checkpoint, død/restart og gem/indlæs fungerer uden softlock.
- [ ] Rumlig MP3-lyd fungerer efter browserens brugerinteraktionskrav.
- [ ] Skærmbilleder fra faktisk browserkørsel viser skov, begge ruter, hytte interiør, strømvalg og monster i scene.
- [ ] Ejer har selv spillet V1 og givet tydelig godkendelse eller feedback.

## Testmatrix
1. Ny start fra ankomst.
2. Broen skaber tydelig støj og stimulus.
3. Skråningen kan bruges i stedet.
4. Dør kan åbnes/lukkes uden at låse spilleren fast.
5. Elpanel reagerer korrekt og ændrer lys.
6. Radio kan indstilles.
7. Antennekonflikt og udendørs reparation fungerer.
8. Monster hører men ser ikke spilleren bag væg.
9. Monster kan miste spilleren og søge.
10. Flugt og slutsekvens kan nås.
11. Død og checkpoint-genstart.
12. Save/load bevarer afgørende state.
13. Browser-console er uden kritiske fejl.
14. Grafisk helhed og FPS evalueres med faktiske screenshots/målinger.

## Aflevering
Cursor skal levere draft-PR med SHA, faktiske kommandoer og PASS/FAIL/SKIPPED, screenshots, kendte fejl, spiltestvejledning og eventuelle afvigelser. En teknisk PASS er ikke det samme som ejerens designgodkendelse.
