# Hollow V2.1R — skovrevision

V2.1S fortsætter i `docs/V2_1S_FOREST.md`. Tallene nedenfor er V2.1R.

Rettelse oven på V2.1. Mission, hytte, monster, radio, strøm og checkpoints er de samme koordinater. Ingen nye lyde, ingen nye missioner, og V2.2 er ikke startet. Versionen er ikke godkendt.

## Instancing

Babylon tegner thin instances som `finalWorld = world * instance`. V2.1 satte master-meshet på det første træ eller den første plante og lagde derefter absolutte matricer i bufferen, så resten blev flyttet en gang til.

V2.1R sætter master til identitet og lægger alle instanser, også den første, i bufferen. Det gælder træer, underskov og sten. En NullEngine-test kontrollerer, at den sammensatte verdensposition er træets position for to punkter, herunder ankomst `(2.2, 8)` og et punkt ved `(25, 45)`. Den gamle fejl, hvor translation og skala tælles med to gange, er dækket af samme test.

## Skov

Kortets koordinater er ikke flyttet. Ankomst, begge ruter, bro, hytte, skur, patrulje, passage, navigation og gemmefil bliver på seed 170147. Komprimeringen er visuel: stamme-friholdet langs ruterne er sænket fra 5,5–6,3 m til 2,2–2,35 m, og træerne står i et forskudt gitter med små grupper i stedet for 4,8 m jævn afstand. Der er over 900 kollisionstræer. Underskov, mos, rødder, grene og væltede stammer er kun billeder. De er ikke dækning, og de spærrer ikke stien.

Kronerne er proceduale klumper på grene, ikke de gamle stakke af skiver og ikke importerede modeller. Langt væk bruges en enklere klump-silhuet af samme højde. Natten er stadig mørk. Lommelygten og hyttens lys er uændrede i funktion.

## LOD

Nære træer, under 32 m, bruger bark, grene og nåleklumper og kaster skygge. Resten bruger silhuetten og kaster ikke skygge. Bufferne bygges ikke, når kameraet flytter sig under 12 m. Der er ingen dispose/opret af nær-instanser pr. skridt. En enhedstest låser, at et skridt fra `(2.2, 8)` til `(6.2, 11)` ikke udløser opdatering, og at 13 m gør.

## Billeder

Samme seed, 170147, og samme kameraer som V1 og V2.1.

| Sted | V2.1 | V2.1R |
| --- | --- | --- |
| Ankomst | `docs/evidence/v2.1/01-arrival.png` | `docs/evidence/v2.1r/01-arrival.png` |
| Forgrening | `docs/evidence/v2.1/02-fork.png` | `docs/evidence/v2.1r/02-fork.png` |
| Skråning | `docs/evidence/v2.1/03-slope.png` | `docs/evidence/v2.1r/03-slope.png` |
| Hytte | `docs/evidence/v2.1/06-hut.png` | `docs/evidence/v2.1r/06-hut.png` |

Ekstra i V2.1R: `08-flashlight.png`, `10-undergrowth.png` og `11-arrival-step.png` efter et ryk på mere end 4 m. V1-billederne i `docs/evidence/v1/` er ikke overskrevet.

## Måling

Headless Chromium via Playwright, 1280×720, seed 170147, efter skuddet ved hytten:

- V2.1: FPS-snit 60,09 over fire prøver, 87 aktive meshes, 4.616.212 trekanter
- V2.1R: FPS-snit 60,18, laveste prøve 60,04, 62 aktive meshes, 999.520 trekanter

Det headless tal ligger på 60 Hz-loftet og er ikke bevis for grafikbelastningen.

Synligt Chromium-vindue i Cursor, 1920×1080, samme seed, kamera ved ankomst `(2.2, 8)` med blik mod `(40, 70)`, fane `visible`:

- 60 frames på 2 sekunder
- gennemsnit 33,36 ms, 95. percentil 35,1 ms, længste frame 36,3 ms
- `stats()`: 30,0 FPS, 92 aktive meshes, 1.025.304 trekanter
- JS-heap 134 MB

Samme vindue målte også skråningen og hytten til omkring 33,4 ms og 1,01–1,03 millioner trekanter. V2.1 blev ikke kørt om i det vindue, så der er ikke et før-FPS derfra. Sammenligningen, der kan stå, er trekanttallet i samme `stats()`-tæller: 4.616.212 i V2.1-rapporten mod 999.520 headless og 1.025.304 i det synlige vindue.

## Tests

- `npx tsc --noEmit` som del af `npm run build`: PASS
- `npm run build`: PASS, 3189 moduler, 2,91 s
- `npx vitest run --testTimeout 20000`: PASS, 7 filer, 30 tests, 3,58 s
- `npx playwright test`: PASS, 1 test, 19,0 s, mission `INSPECT_POWER`, ingen sidefejl
- Enhedstest dækker begge ruter, flugten, døren, stien fra bilen, monsterets hjemmeplads og at stammer holder sig over 2,05 m fra rute-linjerne

Playwright teleporterer til billeder og til krafttavlen. Det er ikke en gennemspillet tur til `COMPLETE` af ejeren.

## Kendte begrænsninger

- Kroner og bregner er stadig lave polygoner. De er tættere og mindre hyldeformede end V2.1, ikke fotorealistiske.
- Væltede stammer og underskov har ingen kollision og er ikke dækning.
- LOD skifter først efter 12 m kameraflugt. Silhuetten kan skifte, positionen skal ikke hoppe.
- Hytte, spillerkrop og vogter er stadig V1.
- Ejerens spiltest mangler. V2.2 er ikke startet.

## Spil

`npm run dev` serverer `http://127.0.0.1:5183/`.
