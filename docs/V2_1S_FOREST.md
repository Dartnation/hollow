# Hollow V2.1S — clean forest art pass

Endnu en revision af skoven, oven på V2.1R. Mission, hytte, monster, radio, strøm og checkpoints har de samme koordinater. V2.2 er ikke startet. Versionen er ikke godkendt, og kronerne opfylder ikke designkravet om troværdige nåletræer tæt på.

Afspilning er slået fra. Lydfilerne indlæses stadig, så testen kan tælle dem, men der startes ingen loops og AudioContext bliver ikke genoptaget.

## Hvad der er ændret

De gamle massive nåleklumper er væk. Hvert nåletræ er en stamme med rodudløb og lag af krydsede alpha-kort med en malet gransilhuet. Der er gran, delvist død gran, fyr og døde stammer, i tre niveauer: nær, mellem og fjern. Fjern-niveauet er stadig en krone, ikke en nøgen pæl. Skiftet har hysteresis, så et par meters gang ikke bytter silhuet. Skygge kastes kun fra den nære bark. Skyggekortet er 512.

Skovbunden bruger den gamle makrotekstur plus en flisebar detalje af jord, mos og nåle. Et mørkt skørt og en række træer uden kollision ligger uden for kortkanten, så den grå afslutning er sværere at se på ruterne. Kigger man bevidst mod vestkanten, kan trælinjen stadig møde himlen.

Underskoven er bregne-, græs- og buskkort i stedet for lyse vifter. De er stadig enkle. Væltede stammer er kun billeder og er ikke dækning.

## Hvorfor det ikke er nok

Kortene læses tæt på som flade, stablede lag, ikke som grene med nåle. De er mørkere og renere end V2.1R's lyse polygonklumper, og de koster færre trekanter, men de er ikke de modeller Issue #7 beder om. Jeg har ikke hentet eksterne assets.

## Forslag, hvis vi vil have rigtige træer

Ingen af disse er downloadet eller importeret.

| Kilde | Licens | Pris | Hvad det er | Forventet belastning |
| --- | --- | --- | --- | --- |
| [Quaternius Ultimate Nature Pack](https://quaternius.itch.io/150-lowpoly-nature-models) | CC0, bekræft teksten på download-siden før import. Nyere Quaternius-pakker bruger en anden licens. | Gratis | Lavpoly fyr, planter og sten, omkring 21 MB | 4–8 prototyper, instanseret som nu. Trekanttallet kan holdes i samme størrelse som denne revision, hvis LOD beholdes. Udtrykket er stiliseret, ikke fotorealistisk. |
| [Poly Haven bark- og jordteksturer](https://polyhaven.com/textures) | CC0 | Gratis | 1K–2K PBR, til stammer og skovbund | Lille. Teksturerne kan lægges på de nuværende meshes. |
| [Poly Haven Pine Tree 01](https://polyhaven.com/a/pine_tree_01) og Fir Tree 01 | CC0 | Gratis | Scannede træer, omkring 17 millioner og 8 millioner polygoner, over 1 GB | Ikke til en skov i browseren som de er. Ét træ sprænger budgettet. Kun en kraftigt reduceret LOD ville kunne bruges, og den reduktion er et separat stykke arbejde. |

Den vej, der kan godkendes, er et lille sæt spilklare graner og fyrre med atlas, 2–8 tusind trekanter pr. nær-model, instanseret, med de nuværende ruter urørt. Quaternius er det sikre gratis næste skridt, hvis det stiliserede udtryk er acceptabelt. Poly Havens scanninger er den forkerte filstørrelse, indtil de er reduceret.

## Billeder

Seed 170147. Samme kameraer som V2.1R, plus bro, vestkant og to neutrale inspektionsbilleder (`?inspect=1`). Inspektion er ikke spillets nat.

| Sted | V2.1R | V2.1S |
| --- | --- | --- |
| Ankomst | `docs/evidence/v2.1r/01-arrival.png` | `docs/evidence/v2.1s/01-arrival.png` |
| Forgrening | `docs/evidence/v2.1r/02-fork.png` | `docs/evidence/v2.1s/02-fork.png` |
| Skråning | `docs/evidence/v2.1r/03-slope.png` | `docs/evidence/v2.1s/03-slope.png` |
| Hytte | `docs/evidence/v2.1r/06-hut.png` | `docs/evidence/v2.1s/06-hut.png` |
| Underskov | `docs/evidence/v2.1r/10-undergrowth.png` | `docs/evidence/v2.1s/10-undergrowth.png` |
| Inspektion, krone | — | `docs/evidence/v2.1s/14-inspect-crown.png` |
| Inspektion, jord | — | `docs/evidence/v2.1s/15-inspect-ground.png` |

V1, V2.1 og V2.1R er ikke overskrevet.

## Måling

Headless Chromium, 1280×720, seed 170147, efter krafttavlen: FPS-snit 60,12, laveste prøve 59,92, 80 aktive meshes, 338.462 trekanter. 60 Hz er loftet i det vindue.

Synligt Chromium i Cursor, 1920×1080, devicePixelRatio 1, samme ankomstkamera som V2.1R `(2.2, 8)` mod `(40, 70)`, 90 frames:

- gennemsnit 16,56 ms, 95. percentil 16,9 ms, længste frame 17,1 ms
- `stats()`: 60,1 FPS, 105 aktive meshes, 351.924 trekanter
- lydbuffere indlæst: 10, ingen afspilning startet

V2.1R i samme type vindue var gennemsnit 33,36 ms og 1.025.304 trekanter. Trekanttallet er cirka en tredjedel, og frametiden er cirka det halve. Det er målt her, ikke et løfte om 60 FPS på en anden maskine.

## Tests

- `npm run build`: PASS, 3189 moduler, 2,88 s
- `npx vitest run --testTimeout 20000`: PASS, 7 filer, 31 tests, 3,72 s
- `npx playwright test`: PASS, 2 tests, 29,4 s, mission `INSPECT_POWER`, ingen sidefejl

Den ekstra enhedstest bygger seed 22011 og finder stadig en sti fra bilen til hytten. Playwright teleporterer. Det er ikke en gennemspillet tur til `COMPLETE`.

## Spil

`npm run dev` serverer `http://127.0.0.1:5183/`.

1. Træd ind. Skoven skal være stille.
2. Gå ankomstruten til skiltet og vælg broen eller skråningen.
3. Åbn hytten, brug krafttavlen, og tjek at lygten stadig tænder.
4. Vil I bedømme modellerne uden nattåge, så åbn `http://127.0.0.1:5183/?inspect=1`. Det er kun et kig, ikke en ny spilmode.

## Kendte begrænsninger

- Kronerne er proceduale kort. De er ikke godkendt som færdige træer.
- Underskov og jord er bedre at se på end de lyse vifter, men ikke højfrekvente plantemodeller.
- Vestkanten er mørkere, ikke usynlig, hvis man sigter direkte mod den.
- Væltede stammer har ingen kollision.
- Hytte, spiller og vogter er stadig V1.
- Ejerens spiltest mangler.
