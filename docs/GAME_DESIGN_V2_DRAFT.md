# HOLLOW V2 — FOREST REBORN
## Creative Director design proposal · 21. november 2026

**Status:** DESIGN DRAFT — ikke implementeret, ikke godkendt til merge og afventer ejerens V1-spiltest.
**Kilde:** Review af V1 PR #2 (`47abf39`), V1 screenshot af skoven og eksisterende V1-design.
**Princip:** Opgrader kvaliteten af præcis det område, vi allerede har, før vi bygger større kort eller flere missioner.

## 1. Executive vision
V1 har et reelt TypeScript/Babylon.js-fundament med mission M01, strømvalg, monster-AI, lyd, checkpoints og kørende browser. Den synlige oplevelse ligner dog foreløbigt et geometrisk prototypemiljø: kegletræer, stor brungrå skovbund, for åbne sigtelinjer og meget ensartet tåge.

I V2 skal de første 30 sekunder opleves som **en fysisk, fugtig, tæt og urovækkende nat i en nordisk skov**. Ikke en større V1 — en langt mere gennemført V1.

### Ikke til diskussion
- Bevar eksisterende missions-state-machine, kodebase, begge ruter, save/load og AI-perception, medmindre der dokumenteres konkret fejl.
- Bevar TypeScript strict + Babylon.js, ingen motor-migration.
- Ingen flere huse, kæmpe kort, multiplayer eller større nyt historieforløb i V2.
- Ingen eksterne assets uden ejerens tilladelse og licens/provenance.
- V2-implementering må først starte efter ejerens faktiske V1-feedback og accept af V2-retning.

## 2. Skov — fra geometri til troværdigt miljø (P0)
**Nyt indtryk:** Træerne skal have varierede silhuetter og overbevisende volumen, og skovbunden skal indeholde fysisk mikrodetalje, ikke blot en tekstur.

### Krav
- Mindst tre tydeligt forskellige procedurale træfamilier (f.eks. gran, fyr, døde/stormskadede stammer), med variation i højde, kroneform, stammeprofil, grenstruktur og materialefarve.
- Trækroner skal være sammensat af mere naturtro gren-/nålemasse. De store synlige kegler fra V1 må ikke være hovedindtrykket i de 5 hero shots.
- Tilføj underskov: græsstrå, små buske, bregner, svampe, rødder, grene, blade, mos, stensamlinger, væltede stammer. Foretag instancing/LOD, så tæthed ikke ødelægger FPS.
- Terræn har lokale forhøjninger, lavninger, våde spor, små grøfter, afbrudte sigtelinjer og steder at søge skjul. Bevar eksisterende navigation og missionspunkter.
- Placer naturen bevidst, så begge ruter har separate visuelle identiteter: broen bliver fugtig, udsat og højlydt; skråningen mørk, lukket og præget af rødder/sten.

**Definition of done:** Når spilleren starter, må man ikke føle, at man står midt på en stor flad arena fyldt med ensartede juletræskegler.

## 3. Lys, vejr og atmosfære (P0)
- Rebalancér ambient-/månebelysning. Skab reelt mørke mellem træerne, men hold vigtige silhuetter og interaktive mål læsbare.
- Lokalt varmt lys i hytten skal være første pejlemærke, ikke en konstant grå tågeflade.
- Lommelygten skal have kontrolleret lysfald, troværdige skygger og mulighed for at afsløre objekter/monsterets form.
- Differentier tåge i nær-, mellem- og fjernplan; brug atmosfærisk perspektiv. Undgå ensfarvet tågevæg.
- Fugt, vind og regn kan ses og høres i kontrolleret omfang; vand, træ og jord ser forskellige ud.
- Brug moderat farvegrading, vignette og bloom, ikke kosmetik som skjuler simpel geometri.

**Tre lyssituationer:** (1) ankomst med fjernt varmt lys, (2) lommelygte mellem tætte stammer, (3) strømskiftet slukker udvendigt sikkerhedslys og gør udendørsområdet markant farligere at læse.

## 4. Skovfogedhytte — ét ikonisk sted (P0)
- Bevar samme fysiske placering og alle nødvendige mission-interaktioner.
- Forbedr tag, bjælker, verandatræ, vinduesrammer, hængsler, dørhåndtag, kabler, lampearmaturer, generatorens detaljer og skrattende radiosender.
- Hytten skal have lag af brugsspor: forladt porcelæn, papir, pletter, mudderspor, skæve stole, slidt træ, gamle fotografier og fortællemæssige spor. Alle modeller skal være lovligt genererede eller godkendte assets.
- Vinduer og døre må ikke vise ulogiske indre rum. Åben/lukket dør skal stemme med AI syn og kollision.
- Et vigtigt setpiece: Hele hyttens sikkerhedslys slukkes, radioens indikator gløder og man hører tung bevægelse ude ved verandatrappen.

## 5. Vogteren — første reelle gyserøjeblik (P1)
- Redesignet silhuet: skæv kropsholdning, ulige lemmer, distinkt hoved/nakke og mindst tre læsbare animationsfaser: lydorientering, søgning, acceleration/jagt.
- Bevar fair syn/hørelse og `lastKnown` fra V1; ingen teleporterende fjende, allestedsnærværende tracking eller angreb gennem vægge.
- Design tre 'beats': (A) noget bevæger sig mellem stammerne, (B) den står næsten stille og lytter ved hytten, (C) den søger efter lyden ved generatoren.
- En skræmmende hændelse må gerne være sjælden, men skal have bevægelse, timing og en lydmæssig opbygning. Ikke konstant jumpscare.
- Hvis ressourcer er begrænsede, prioritér troværdig silhuet og animation frem for avanceret realistisk hud.

## 6. Lyddesign og spændingskurve (P1)
- Udvid det nuværende MP3-manifest med juridisk sikre ambience-lag: distant wind, close leaves, branches, dry/wet footsteps, house creak, radio crackle, monster breathing.
- 3D-position og afstand er eksisterende fundament. Indfør dæmpning bag vægge og enkelte skift mellem udendørs/indendørs akustik, uden at påstå fysisk komplet ray-traced audio.
- Dynamisk spændingskurve: stilhed efterfulgt af tynde advarselstegn, intensitet ved undersøgelse og jagt, afslutning med plads til lettelse.
- Undertekster til alle betydningsfulde informationslyde. Respekter browserens audio-gesture.

## 7. Mission og brugeroplevelse (P1)
- M01 `Det sidste signal` bevares. Forbedr **oplevelsen**, ikke bare antallet af opgaver.
- Bedre diegetisk vejledning i starten (landmærker, spor, radiolyde), så spilleren ikke konstant må læse en topbanner.
- Radio og strøm skal have konkret feedback gennem lyskilder, skærm/viser, klik og elektriske lyde.
- Bro vs. skråning får visuel og lydmæssig identitet; begge er stadig mulige, men opleves forskellige.
- Undersøg pointer lock/resume, interaktions-afstand og risiko for softlocks i faktisk brugerforløb.

## 8. Teknisk implementering — bevar det som virker
- Opdel `src/render/worldView.ts` i fokuserede modules, efterhånden som ny vegetation og lys implementeres. Undgå én uoverskuelig mega-fil.
- Brug thin instances/LOD/culling til vegetation. Profilér draw calls, mesh count, antal aktive lys/skygger og grafiktid på konkret hardware.
- Sammenlign V1 og V2 med **samme seed, kamerakoordinater, opløsning og grafikindstillinger**.
- Fejlsikr eventuelle falske referenceværdier eller timings fra V1, men ændr ikke missionsstater uden dokumenteret krav.
- `?test=1` kan bruges til reproducerbar screenshotopsætning, men testens resultater skal eksplicit kaldes 'QA teleport', ikke faktisk spilgennemførsel.

## 9. Styrk testdækningen (P0)
V1 Playwright bruger teleport-testkroge til screenshots og går kun til `INSPECT_POWER`. Vitest gennemspiller missionen ved at placere spilleren direkte ved mål.

V2 skal derfor indeholde:
- En separat browser-test, der **gennemfører M01 til `COMPLETE` via ægte gameplayinput og interaktioner**. Ingen `placePlayer`, `placeMonster`, `setFrequency` eller direkte state-ændringer i denne test.
- Fortsat unit-tests for hurtige deterministiske transitions og AI-scenarier. Skeln klart mellem unit, QA-teleport, browser-playthrough og menneskelig spiltest.
- Rapport med FPS og frame timings på den faktisk testede PC, skærmopløsning, browser og grafikindstillinger. Mål 60 FPS på relevante gaming-PC'er, og dokumentér ærligt hvis ikke opnået.
- Ejerens menneskelige V2-spiltest skal vurdere grafik, spænding, mission, AI, lyd og styring.

## 10. Godkendelseskriterier (visuelle)
V2 kan ikke kaldes færdig før:
1. Fem V1/V2-sammenligningsbilleder viser markant bedre skov, to ruter, hytte og monster (samme vinkler).
2. Ingen fremtrædende, ensformige kegletræer i hero shots.
3. Synlige detaljer på jord, vegetation og hytte; scenen føles ikke tom.
4. Natstemningen har tydelig forskel på mørke skovlommer, lommelygte og varmt huslys.
5. Monstret kan genkendes som en designet figur med flere læsbare bevægelsesfaser.
6. M01's kerne, begge ruter, strøm-mutex, checkpoint, AI og lyd fortsætter med at fungere.
7. Automatiseret browser-playthrough til slutningen lykkes uden state-teleport, og begrænsninger dokumenteres.
8. Ingen merge til `main` og ingen overgang til V3 uden ejerens eksplicitte godkendelse.

## 11. Forslået rækkefølge for Cursor (efter ejerens accept)
- **V2.1** Naturlig skovbund, træer, terræn og visuel komposition.
- **V2.2** Hytte, materialer, lys og tåge.
- **V2.3** Vogterens udseende/animation, lyddynamik og horror beats.
- **V2.4** Mission-polering, regressionstest, browser-playthrough, optimering og skærmbilleder.

Hver del må leveres i sin egen commit eller lille PR, men de udgør samlet **V2**. Kvalitet vægter højere end antal features.

## 12. Brugerens åbne V1-feedback — udfyld før implementering
- Var skoven for tom eller for lys/mørk?
- Kunne missionen gennemføres uden hjælp?
- Hvor uhyggelig var Vogteren? Kunne du undslippe?
- Hvilket sted var mest stemningsfuldt? Hvilket var kedeligst?
- Var lyden skræmmende og tydelig?
- Hvilke konkrete fejl/mangler oplevede du?

**Dette dokument er et designforslag, ikke en ordre om at igangsætte V2-kodning.**
