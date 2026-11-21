# HOLLOW V2 — FOREST REBORN
## Creative Director design proposal · 21. november 2026

**Status:** DESIGN DRAFT — ikke implementeret, ikke godkendt til merge og afventer ejerens V1-spiltest.
**Kilde:** Review af V1 PR #2 (`47abf39`), V1 screenshot af skoven og eksisterende V1-design.
**Princip:** Færdiggør udseende, animationer og logik for skov, hytte, monster og **spillerkarakter**. Derefter én særskilt lydfase, derefter én særskilt fase med filmisk lys/vejr/tåge, og først til sidst nye missioner.

**Ejerens prioritering (fast fase-gate): V2 = skov + hytte + spillerkarakter + monster med gennemtestet logik. V3 = professionel lyd. V4 = filmisk lys, skygger, tåge, vejr og farver. V5 = nye/udvidede missioner.** Eksisterende V1-lyd, simple fungerende lyskilder og M01 beholdes som testgrundlag i V2. De efterfølgende faser er selvstændige kvalitetsløft.

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

## 3. Lys, vejr og atmosfære — grundfunktioner i V2, professionel lysfase i V4
**I V2 kræves kun teknisk funktionelt basislys** til skov/hytte, interaktioner, monsterets synssans og lommelygten. Sørg for at lysændringer ikke bryder missionens elvalg, og at områderne kan navigeres og testes.

**I V4 skal vi fokusere professionelt og særskilt på:**
- Måneskin, lokale lyskilder, realistisk inspirerede skygger og skovens kontrast/lysretning.
- Lommelygtens kegle, lysfald, skygger og fysiske følelse.
- Tåge med dybde, atmosfærisk perspektiv, nedbør/vådhed og vejrvariation.
- Filmisk farvegrading, tilpasning mellem interiør/eksteriør og kontrolleret postprocessing.
- Performance under dynamisk lys, skygger og tåge.

**Vigtigt:** Vent ikke med *alt* lys til V4; uden brugbart basislys kan man hverken vurdere grafik, se animationer eller teste monsterets perception.

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

## 5a. Spillerkarakter — synligt og mekanisk gennemarbejdet (P0)
Spilleren er i førsteperson. Der skal være en bevidst karakterpræsentation, ikke et svævende kamera.

- Design sammenhængende førstepersonshænder/arme, lommelygtegreb og passende krops-/skyggesilhuet, hvor det giver visuel mening. Bevægelsen skal føles fysisk uden stor, forstyrrende kameravuggen.
- Gang, løb, dukning, stop/start, drejning og interaktion har responsiv styring og synligt troværdige overgange. Hænder og lommelygte reagerer på interaktion og ikke kun UI-prompt.
- Justér øjenhøjde, FOV, bevægelsesrespons, acceleration, kollision og forholdet mellem kropsvolumen og døråbninger. Spilleren må ikke gå gennem vægge eller sidde fast på små ujævnheder.
- Animation og gameplay skal være synkroniseret; fx lommelygte/arm ved E-interaktion og naturlig overgange ved sprint/dukning.
- Valider pointer-lock, pause/fortsæt, save/load, interaktioner, checkpoint-genstart og både skovruter.
- V1-mekaniske regler må ikke ødelægges for at forbedre grafikken. Eventuelle nye regler specificeres og testes særskilt.

## 6. Lyd — udskyd professionelt lydarbejde til V3
- V2 bevarer V1's eksisterende MP3, lyd-events og browserafspilning, så monsterets hørelse og gameplay kan testes.
- Kun nødvendige rettelser af lydhændelser, der ellers ødelægger monsterets sensorik, er V2-scope.
- **Ingen større arbejde med nye MP3-filer, musik, voice-over, rumklang, lydmix eller Horror Director-lydlag i V2.**
- Efter ejerens V2-godkendelse designes V3 særskilt som professionel lydunderstøttet gyseroplevelse.

## 7. Missioner — bevar eksisterende M01, udvid først i V5
- M01 `Det sidste signal` bruges som **funktionel regressionstest** af skov, hytte, spillerinteraktion og monsteradfærd.
- Ingen nye missioner, bygninger, fortællingsforløb eller væsentligt ændrede missionsregler i V2.
- Kritiske softlocks, misvisende prompts og ødelagte missionstransitions er fejl og skal naturligvis rettes.
- Professionelt missionsdesign og udvidet historie hører til **V5**, efter V3-lyd og V4-lys er godkendt.

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

## 10. Definition of done — V2-kvalitetsgate
V2 er først klar til ejerens godkendelsestest når:
1. Sammenligningsbilleder fra samme V1/V2-kamerapositioner dokumenterer væsentligt bedre skov, hytte, monster og spillerkarakter.
2. Ingen fremtrædende ensformige kegletræer i hero shots; skovbund, underskov, grene, sten og naturlige sigtelinjer ses tydeligt.
3. Skovfogedhyttens interiør og eksteriør er sammenhængende, detaljeret og fysisk spilbart.
4. Grundlæggende lys, lommelygte og hyttens strømstyrede lamper fungerer og kan bruges til gameplaytest. Filmisk lys, avancerede skygger, tåge og farvegrading godkendes først i V4.
5. Monsteret har et særpræget visuelt design, troværdige animationsfaser og konsekvent perception/navigationsadfærd.
6. Spillerkarakterens førstepersonsvisning/hænder/kropsfornemmelse og gang/løb/duk/interaktion føles gennemarbejdet, uden kamera- eller kollisionsfejl.
7. **Alle aftalte relevante funktionelle og regressionstests** for spiller og monster består, inklusive tab af syn, lydstimuli, vægge, døre, AI-søgning, undvigelse, checkpoints, power-mutex og save/load. Målet er fuldt gennemtestet V2-scope; absolut fejlfrihed kan ikke garanteres.
8. En browser-playthrough når M01 `COMPLETE` gennem normal styring, uden QA-teleport eller direkte state-injektion; eventuelle testbegrænsninger dokumenteres.
9. Der er rigtige FPS- og frame-time målinger fra brugerens maskine eller dokumenteret testhardware; ydelsen er acceptabel uden at ofre spilbarhed.
10. Eksisterende MP3 og M01 fungerer fortsat. Nye lydspor/lydpolering og nye missioner er **ikke** kriterier i V2.
11. Ejer spiller og giver eksplicit godkendelse før overgang til **V3 lyd**. Ingen automatisk merge eller overgang.

## 11. Cursor-arbejdsrækkefølge for V2 (efter ejerens accept)
- **V2.1** Skov, terræn, træer og underskov; kun nødvendigt funktionslys til vurdering.
- **V2.2** Skovfogedhytte: materialer, eksteriør, interiør, detaljer og dør-/interaktionsintegration.
- **V2.3** Spillerkarakter: førstepersonskrop/hænder, lommelygte, bevægelse, animation og kollision.
- **V2.4** Vogteren: redesign, animation, fair sanser, søgeadfærd, navigation og undvigelse.
- **V2.5** Model-, tekstur- og animationspolering, automatiserede fulde tests, browser-playthrough, målt performance, screenshots og brugerens accept.

Disse dele kan opdeles i mindre commits/PR'er, men udgør tilsammen **V2**. Ingen ny lydpakke eller nye missioner i denne fase.

**Næste versioner:** V3 = professionel MP3-lyd, spændingsmusik og rumlig atmosfære; V4 = filmisk belysning, lommelygte, skygger, tåge og vejr; V5 = missioner, gåder, historie og konsekvenser.

## 12. Brugerens åbne V1-feedback — udfyld før implementering
- Var skoven for tom eller for lys/mørk?
- Kunne missionen gennemføres uden hjælp?
- Hvor uhyggelig var Vogteren? Kunne du undslippe?
- Hvilket sted var mest stemningsfuldt? Hvilket var kedeligst?
- Var den eksisterende lyd funktionel (kun fejlrettelser i V2)?
- Hvilke konkrete fejl/mangler oplevede du?

**Dette dokument er et designforslag, ikke en ordre om at igangsætte V2-kodning.**
