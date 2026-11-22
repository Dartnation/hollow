# Hollow V2.1U — de nye træer i den eksisterende skov

Skovens tæthed, træpunkter, ruter, hytte, bro og vogter er de samme. De flade nålekort er skiftet ud med de reducerede Poly Haven-modeller fra showroomet. V2.2 er ikke startet.

## Hvad der står hvor

`world.trees` er ikke ændret. Seed 170147 og 22011 giver begge 2.400 træer, og en test låser x, z og art. Kollisionsradius og navigation bruger stadig de gamle stammemål.

| Art i data | Model | Licens |
| --- | --- | --- |
| Gran, kind 0 og 2 | [Fir Tree 01](https://polyhaven.com/a/fir_tree_01), variant c | CC0 |
| Fyr, kind 1 | [Pine Tree 01](https://polyhaven.com/a/pine_tree_01), variant b | CC0 |
| Død stamme, kind 3 | Samme granstamme uden nålekronen | CC0 |

Højden følger den gamle prototype: et træ der før var 6,4 m gange sin skala, er det stadig. Modellens bund sidder på terrænet. Rotationen og hældningen er de gamle værdier.

[Jacaranda](https://polyhaven.com/a/jacaranda_tree), [Othonna cerarioides](https://polyhaven.com/a/othonna_cerarioides) og [Searsia burchellii](https://polyhaven.com/a/searsia_burchellii) er stadig kun i `?showroom=1`. De er ikke nordisk skovflora og er ikke strøet ud.

Nærtræet er den fulde spilmodel: gran 4.358 trekanter, fyr 9.157 efter en tættere krone. Mellem 13 og 34 m bruges færre af de samme nålekort. Længere væk er kronen tyndere. Træer over 72 m tegnes ikke; nattågen har allerede skjult dem. Råscanningerne ligger i `.cache/` og er gitignoreret.

Væltede stammer, rødder og kviste bruger granens barkbillede. Mos og græs er de eksisterende flader, ikke nye planter.

## Sådan ser man det

`npm run dev` og åbn `http://127.0.0.1:5183/?test=1&seed=170147`.

Før-billederne er skoven med V2.1S-kortene. Efter-billederne er samme kamera, samme seed.

| Kamera | Før | Efter |
| --- | --- | --- |
| Ankomst, nat | `docs/evidence/v2.1u/before-01-arrival.png` | `docs/evidence/v2.1u/after-01-arrival.png` |
| Forgrening | `before-02-fork.png` | `after-02-fork.png` |
| Skråning | `before-03-slope.png` | `after-03-slope.png` |
| Hytte | `before-06-hut.png` | `after-06-hut.png` |
| Bro | `before-12-bridge.png` | `after-12-bridge.png` |
| Underskov | `before-10-undergrowth.png` | `after-10-undergrowth.png` |
| Neutral krone | `before-14-inspect-crown.png` | `after-14-inspect-crown.png` |
| Neutral skovbund | `before-15-inspect-ground.png` | `after-15-inspect-ground.png` |
| Nær træ, neutral | | `after-14-close-fir.png` |

## Ærlig begrænsning

Granens stamme og nåle læser som et træ tæt på. Fyrrens krone er stadig mere grå og åben end granens, også efter flere nålekort. På afstand er kronerne tyndere kort, ikke en færdig silhuet. Det er ikke et fotorealistisk miljø. Skovbunden er stadig det eksisterende terræn med bark på det døde træ.

Ved ankomst i et synligt Chromium-vindue på 1920×1080, seed 170147, tegnes 838.072 trekanter. V2.1T målte 354.228 trekanter og 16,47 ms samme sted. Den udglattede tæller nåede 60 fps, som er skærmens loft, så en merpris under loftet kan ikke ses. Råtallene ligger i `docs/evidence/v2.1u/performance.json`.
