# Hollow V2.1T — terrænfejl og modelprøve

Skovens tæthed er uændret. Træerne i selve skoven er stadig V2.1S-kortene. Denne gren retter det sorte baggrundsplan og stiller en modelprøve op ved siden af de nuværende modeller. Prøven er ikke sat ind i skoven. Den venter på godkendelse. V2.2 er ikke startet.

## Den sorte flade

`forest-skirt` var et udtekstureret plan på y = −0,05, større end kortet. `terrainHeight` kan ligge under det plan. Ved bækken trækkes højden med op til 2,55 m, og `terrainHeight(76, 70)` er under −0,05. Der tegnede planet sig oven på skovbunden i lavningerne. Det er målt med en enhedstest, ikke gættet ud fra mørket i natbillederne.

Planet ligger nu 2,5 m under den laveste terrænprøve på et 2 m-gitter. En test kræver, at enhver prøve på et 8 m-gitter ligger over planet, og at den gamle højde −0,05 skærer bækken. Uden for kortet følger fire terrænstrimler højdefunktionen, så kanten ikke er et hul. Strimlerne dækker ikke ruterne.

Bækken efter rettelsen: `docs/evidence/v2.1t/16-stream.png`. Samme seed og de gamle kameraer ligger ved siden af V2.1S i `docs/evidence/v2.1s/`.

## Showroom

Åbn `http://127.0.0.1:5183/?showroom=1`. Neutral belysning. Skoven, regnen, bilen og vogteren er slået fra på den side. Gameplay-siden uden parameteren er uændret, bortset fra terrænrettelsen og at V1-lyden spiller igen.

Til venstre står V2.1S. Til højre står de reducerede Poly Haven-træer, ikke den gamle procedurale prøve.

| Billede | Hvad det viser |
| --- | --- |
| `docs/evidence/v2.1t/showroom-front.png` | Begge graner, begge jordstykker |
| `docs/evidence/v2.1t/showroom-spruce.png` | Prøvegranen tæt på, forfra |
| `docs/evidence/v2.1t/showroom-spruce-side.png` | Samme gran fra siden, med V2.1S-hylderne bagved |
| `docs/evidence/v2.1t/showroom-pine.png` | Prøvefyrren, bar stamme og krone |
| `docs/evidence/v2.1t/showroom-fern.png` | Prøvebregnen |

Michael har sagt ja til Poly Haven Fir Tree 01 og Pine Tree 01, begge CC0. Råfilerne ligger uden for git. I showroomet står variant c af granen og variant b af fyrren, skåret ned til spilstørrelse: stammen og de døde grene er beholdt, og de titusindvis af nålesplinter er bygget om til krydsede kort med de fotografiske kviste. Granen er 4.358 trekanter og 3,3 MB. Fyrren er 5.843 trekanter og 3,4 MB. Skoven bruger dem ikke endnu.

Granens stamme har den fotograferede bark, og kronen læser som nåle frem for hylder. Fyrrens stamme og rodudløb er fra scanet. Fyrrens krone er stadig tynd og grå og er ikke en færdig udskiftning. Foran træerne står også [Othonna cerarioides](https://polyhaven.com/a/othonna_cerarioides) og [Searsia burchellii](https://polyhaven.com/a/searsia_burchellii), begge CC0, reduceret til 4.788 og 6.166 trekanter. De har deres egen størrelse, omkring 1,4 m og 1,9 m. Til højre står [Jacaranda Tree](https://polyhaven.com/a/jacaranda_tree), CC0, skåret ned fra 3,9 millioner trekanter til 32.667 og 5,4 MB, og vist i 8 m højde. Kronen er stadig åben i forhold til scanet. Bregnen er uændret. Ingen af modellerne er sat ind i skoven.

`node scripts/reduce-polyhaven.mjs` kan bygge GLB-filerne igen, når `.cache/polyhaven` indeholder de hentede 1K-udsnit. Cachen er gitignoreret.

Enhedstesten kræver, at hver GLB er under 8,5 MB og mellem 1.500 og 8.500 trekanter. Det tal er én model, ikke skovens samlede tal. Den gamle procedurale prøve har stadig sin egen test og bruges ikke i showroomet.

## Assets

De to CC0-modeller er godkendt og reduceret til showroomet. De rå scans er ikke i repoet.

| Kilde | Licens | Pris | Begrænsning |
| --- | --- | --- | --- |
| [Poly Haven Pine Tree 01](https://polyhaven.com/a/pine_tree_01) og [Fir Tree 01](https://polyhaven.com/a/fir_tree_01) | CC0 | Gratis | Fir Tree 01 er oplyst til omkring 26,7 millioner polygoner og 957 MB. Pine Tree 01 er et scan i samme klasse. Billederne på siderne viser kvaliteten. Råfilerne kan ikke instanseres i den her skov. |
| [Poly Haven-teksturer](https://polyhaven.com/textures) til bark og jord | CC0 | Gratis | 1K–2K er en realistisk størrelse til de nuværende meshes. |
| [Quaternius Ultimate Nature Pack](https://quaternius.itch.io/150-lowpoly-nature-models) | CC0 på den side. Nyere pakker har en anden licens. Bekræft teksten før et ja. | Gratis | For lavpoly til det her kvalitetskrav. Det ville ligne endnu en prototype. |

Næste skridt er Michaels ja eller nej til de to showroom-træer, før de sættes ind på de eksisterende placeringer. Fyrrens krone skal være tættere, før den kan bære skoven.

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
