# Hollow V2.1 — skov, terræn og lys

Grafikfase oven på den spilbare V1-kode. Mission, styring, hytteinteriør, monster-AI, radio, strøm og checkpoints er uændrede. Ingen nye lyde og ingen nye missioner. Versionen er ikke godkendt.

## Hvad der er ændret

- Otte proceduale træfamilier: gran med grene og nålemasser, fyr med åben krone, og døde stammer. Nære træer kaster skygge. Fjerne træer er thin instances.
- Underskov: bregner, buske, græstotter, mos og væltede stammer, holdt væk fra stier, hytte og bro, så ruterne kan gås.
- Skovbund med sti, vådt leje langs bækken, mørkere skråning, mospletter og en normal map. Højden er den samme som i V1, så navigationen ikke flytter sig.
- Mørkere nat, tåge med dybde, månelys med kaskadeskygger på de nære stammer, og en varmere, smallere lommelygte. Husets udelys er pejlemærket og slukker, når strømmen går til radioen.

## Sammenligning

V1-billederne ligger i `docs/evidence/v1/`. V2.1 er taget fra de samme kamerapositioner i `docs/evidence/v2.1/`. Ekstra: `08-flashlight.png` og `09-lights-off.png`.

## Måling

Headless Chromium, seed 170147, samme maskine som testen:

- FPS-snit 60 over fire prøver
- 87 aktive meshes
- ca. 4,6 millioner trekanter
- ingen sidefejl
- mission stod i `INSPECT_POWER` efter den eksisterende testkrog

Det er ikke en måling fra et almindeligt browservindue på ejerens pc. Skygger beregnes kun for træer inden for 28 meter.

## Tests

- `npx tsc --noEmit` som del af `npm run build`: PASS
- `npm run build`: PASS, 3187 moduler, 3,35 s
- `npx vitest run --testTimeout 20000`: PASS, 6 filer, 24 tests, 4,68 s
- `npx playwright test`: PASS, 1 test, 14,9 s

## Kendte begrænsninger

- På lang afstand ligner kronerne stadig lag. Tæt på er stammen, grenene og nålemasserne tydelige.
- Bregner og græs er enkle vifter, ikke individuelle blade.
- Hytten, spillerkroppen og vogterens silhuet er V1. De hører til senere V2-dele.
- Ejerens spiltest mangler. V2.2 er ikke startet.
