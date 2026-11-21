# Hollow V1 — implementeringsstatus

Gren: `feature/v1-vertical-slice`. Status er en teknisk aflevering. Ejerens spiltest er ikke udført, og versionen er ikke godkendt.

## Kommandoer

Kørt 21. november 2026 i `C:\Users\Momex\hollow` på Node 22.

| Kommando | Resultat |
| --- | --- |
| `npx tsc --noEmit` | PASS, exit 0 |
| `npx vitest run --testTimeout 20000` | PASS, 6 filer, 24 tests, 4,61 s |
| `npm run build` | PASS. `tsc --noEmit` og Vite-build, 3180 moduler, færdig på 3,35 s |
| `npx playwright test` | PASS, 1 test på 11,6 s. Screenshots i `docs/evidence/v1/` |

Præcis konsoloutput fra den sidste kørsel står i pull requesten. `docs/evidence/v1/report.json` er skrevet af browser-testen og indeholder den målte FPS.

## Acceptkriterier

| Kriterium | Resultat |
| --- | --- |
| Install, dev, build og tests | PASS for typecheck, unit, build og Playwright. `npm install` blev kørt, da projektet blev sat op. |
| Konfigurerbar port | PASS. `PORT` eller `vite --port`. E2E bruger 5199. |
| First-person, interaktion, lygte, kollision | PASS i simulation og browser. Musefangst kræver et klik i et rigtigt vindue. |
| To ruter, forskellig længde og støj | PASS. Unit-test måler længde og hældning. Broen er træ og højlydt. |
| Hytte, dør, radio, panel | PASS. Åben dør kan gås igennem. Lukket dør stopper kroppen. |
| Strøm-mutex | PASS. Lys og radio kan ikke være tændt samtidig. |
| Frekvens med meter og tone | PASS. Lås ved kvalitet over 0,93 omkring 97,4 MHz. |
| Mission M01 til slut | PASS i headless gennemspilning af begge ruter. |
| Hørelse og synslinje | PASS. Bro-trin giver stimulus. Lukket hytte blokerer syn. |
| Jagt kan mistes | PASS. Sidste sete sted bliver stående, når spilleren går indenfor. |
| Checkpoint, død, gem/indlæs | PASS i unit-test. |
| Rumlig MP3 | PASS. Browser-testen kræver mindst 8 indlæste klip. Afspilning starter efter klik. |
| Screenshots | PASS. Syv billeder fra headless Chromium. |
| Ejer har spillet og godkendt | SKIPPED. Afventer Michaels spiltest. |

## Afvigelser

- Navigation er et 2 m gitter med A* og string-pull, ikke Recast. Døre står på gitteret og blokerer kun, når de er lukket.
- Kollision er en cirkel mod akse-rettede kasser. Der er ingen Havok. Bevægelse deles i skridt på 0,05 s, så en tynd dør ikke kan løbes igennem.
- Skov, hytte og vogter er proceduale meshes. Lyden er originale MP3-filer lavet med ffmpeg. Der er ingen indtalt stemme og ingen påstand om fotorealisme.
- `?test=1` lægger et QA-kald på `window.__HOLLOW__`, så Playwright kan placere kameraet. Det er en bevidst testkrog, ikke en spillermekanik.
- Vogteren åbner ikke døre. Den spawner ved sit hjem i nord, ikke på spilleren.

## Kendte begrænsninger

- Træerne er få, gentagne silhuetter. Jordbunden og tågen kan læses, men skoven er stadig et første udtryk.
- Vogteren er en mørk, leddelt figur. Silhuetten kan ses foran hytten. Den har ikke en færdig karakteranimation ud over gang, lytten og angreb.
- Headless Chromium målte 60 FPS i `docs/evidence/v1/report.json`, uden konsolfejl, med missionen i `INSPECT_POWER`. Det er ikke en måling fra et rigtigt spilvindue på Michaels maskine.
