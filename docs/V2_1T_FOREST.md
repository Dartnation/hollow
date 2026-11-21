# Hollow V2.1T — terrænfejl og modelprøve

Skovens tæthed er uændret. Træerne i selve skoven er stadig V2.1S-kortene. Denne gren retter det sorte baggrundsplan og stiller en modelprøve op ved siden af de nuværende modeller. Prøven er ikke sat ind i skoven. Den venter på godkendelse. V2.2 er ikke startet.

## Den sorte flade

`forest-skirt` var et udtekstureret plan på y = −0,05, større end kortet. `terrainHeight` kan ligge under det plan. Ved bækken trækkes højden med op til 2,55 m, og `terrainHeight(76, 70)` er under −0,05. Der tegnede planet sig oven på skovbunden i lavningerne. Det er målt med en enhedstest, ikke gættet ud fra mørket i natbillederne.

Planet ligger nu 2,5 m under den laveste terrænprøve på et 2 m-gitter. En test kræver, at enhver prøve på et 8 m-gitter ligger over planet, og at den gamle højde −0,05 skærer bækken. Uden for kortet følger fire terrænstrimler højdefunktionen, så kanten ikke er et hul. Strimlerne dækker ikke ruterne.

Bækken efter rettelsen: `docs/evidence/v2.1t/16-stream.png`. Samme seed og de gamle kameraer ligger ved siden af V2.1S i `docs/evidence/v2.1s/`.

## Showroom

Åbn `http://127.0.0.1:5183/?showroom=1`. Neutral belysning. Skoven, regnen, bilen og vogteren er slået fra på den side. Gameplay-siden uden parameteren er uændret, bortset fra terrænrettelsen og at V1-lyden spiller igen.

Til venstre står V2.1S. Til højre står prøven.

| Billede | Hvad det viser |
| --- | --- |
| `docs/evidence/v2.1t/showroom-front.png` | Begge graner, begge jordstykker |
| `docs/evidence/v2.1t/showroom-spruce.png` | Prøvegranen tæt på, forfra |
| `docs/evidence/v2.1t/showroom-spruce-side.png` | Samme gran fra siden, med V2.1S-hylderne bagved |
| `docs/evidence/v2.1t/showroom-pine.png` | Prøvefyrren, bar stamme og krone |
| `docs/evidence/v2.1t/showroom-fern.png` | Prøvebregnen |

Prøvegran og prøvefyr har stammer med rodudløb, grene med volumen og små nåleklaser på kvistene. De er ikke de flade hylder. De er stadig for åbne til at kaldes naturtro kroner, og klaserne gentager sig. Bregnen er syv blade omkring en stilk og læser stadig som en lille stjerne. Jordstykket til højre har mos, sten og nåle i en 512-tekstur. Ingen af delene er skiftet ind i skoven.

Enhedstesten holder prøvegran og prøvefyr mellem 800 og 8.000 trekanter stykket, så en senere udskiftning kan instanseres uden at sprænge det nuværende budget. Det tal er geometrien for én model, ikke skovens samlede tal.

## Assets, hvis prøven ikke rækker

Intet er downloadet eller importeret.

| Kilde | Licens | Pris | Begrænsning |
| --- | --- | --- | --- |
| [Poly Haven Pine Tree 01](https://polyhaven.com/a/pine_tree_01) og [Fir Tree 01](https://polyhaven.com/a/fir_tree_01) | CC0 | Gratis | Fir Tree 01 er oplyst til omkring 26,7 millioner polygoner og 957 MB. Pine Tree 01 er et scan i samme klasse. Billederne på siderne viser kvaliteten. Råfilerne kan ikke instanseres i den her skov. |
| [Poly Haven-teksturer](https://polyhaven.com/textures) til bark og jord | CC0 | Gratis | 1K–2K er en realistisk størrelse til de nuværende meshes. |
| [Quaternius Ultimate Nature Pack](https://quaternius.itch.io/150-lowpoly-nature-models) | CC0 på den side. Nyere pakker har en anden licens. Bekræft teksten før et ja. | Gratis | For lavpoly til det her kvalitetskrav. Det ville ligne endnu en prototype. |

Næste skridt efter et nej til prøven er et spilklart sæt på 2–8 tusind trekanter pr. nær-model, med en licens Michael har sagt ja til. Ikke et scan og ikke endnu en omfarvning.

## Måling

Skoven, ikke showroomet. Synligt Chromium, 1920×1080, seed 170147, ankomst `(2.2, 8)` mod `(40, 70)`, 90 frames:

- V2.1S: 16,56 ms i snit, 351.924 trekanter
- V2.1T: 16,47 ms i snit, 16,8 ms på 95. percentilen, længste frame 17,1 ms, `stats()` 60,1 FPS, 109 meshes, 354.228 trekanter

Lydkonteksten kørte, og 10 buffere var indlæst. Headless efter krafttavlen: FPS-snit 60,18, 75 meshes, 341.160 trekanter. 60 Hz er loftet der.

## Tests

- `npm run build`: PASS, 3192 moduler, 2,88 s
- `npx vitest run --testTimeout 20000`: PASS, 9 filer, 34 tests
- `npx playwright test`: PASS, 3 tests, mission `INSPECT_POWER`

Playwright teleporterer. Det er ikke en gennemspillet tur til `COMPLETE`.

## Spil

`npm run dev` serverer `http://127.0.0.1:5183/`.

1. Gå ankomstruten og bækken. Skovbunden skal følge lavningen, uden et sort låg.
2. Åbn `/?showroom=1` og sammenlign gran, fyr, bregne og jord.
3. Sig ja eller nej til prøven, før den sættes ind i skoven.
