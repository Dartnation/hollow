# HOLLOW — Game Design V1: Den første nat

## Vision
Et filmisk first-person survival-horrorspil, hvor skovens geografi, lys, lyd, missioner og monsterets sanser skaber spænding gennem konsekvenser frem for tilfældige jumpscares.

**V1 er en 10–15 minutters vertical slice, ikke hele spillet.** Den skal kunne spilles og testes fra start til slut.

## Præmis
Klokken 00.47 ankommer spilleren til en afspærret skov efter et nødkald. Skovfogedens station har svagt lys og en defekt radio. En generator kan ikke drive både radiosender og sikkerhedslys; genopretning af signalet gør området mørkere og tiltrækker en skikkelse, der reagerer på lyd. Efter en udendørs reparation lykkes transmissionen, men signalets afsender afsløres som noget umuligt.

## Designprincipper
1. **Mening frem for fyld:** Alle mål ændrer verden, afslører historie eller skaber risiko.
2. **Forståeligt før uforudsigeligt:** Spilleren skal kunne lære reglerne; AI'en må ikke snyde.
3. **Spændingskurve:** ro → undren → pres → jagt → kort lettelse → afsløring.
4. **Sanselig kvalitet:** prioriter lommelygte, regn, træ, skygger, hytteinteriør og lydbillede over stor kortstørrelse.
5. **Spillerens valg:** bro vs. skråning og radio vs. lys har mærkbare konsekvenser.

## V1-scope
- Ét kompakt skovområde på ca. 240×240 m med ankomstzone, forgrening, træbro, skovskråning, skovfogedhus og generatorskur.
- Én fuldt spilbar hytte med fysisk forståelig strømfordeling, radio, panel, døre og muligheder for skjul.
- Én monsterprototype, **Vogteren**, med syn, hørelse, hukommelse, søgning og jagt.
- Én sammenhængende mission, **M01 Det sidste signal**, med checkpointer og afslutning.
- First-person WASD/mus, Shift løb, C/Ctrl duk, E interaktion, F lommelygte, Tab journal og Esc pause.
- MP3-lyde via et hændelsesstyret system, undertekster og justerbar lysstyrke.

**Ikke V1:** fuld open-world, flere indrettede huse, flere monstre, crafting, multiplayer, fotorealistisk hud, alle senere missioner eller desktop-pakning.

## Fem akter
**A (0–2 min):** Ankomst, bilradio, skilt, synligt pejlemærke. Introducer styring naturligt.

**B (2–4 min):** Bro (hurtig/højlydt) eller skovskråning (langsom/skjult). Valget påvirker monsterets første undersøgelse.

**C (4–8 min):** Gå ind i skovfogedhuset, undersøg radiosignal og elpanel, afbryd sikkerhedslys for at tænde radiosenderen, find frekvensen via forståelig feedback.

**D (8–12 min):** Forbindelsen brydes. Gå til generatorskuret under konkret monstertrussel. Spiller kan aflede, snige og skjule sig.

**E (12–15 min):** Transmissionen lykkes; den modtagne stemme antyder et umuligt tidsmæssigt paradoks. Kontrolleret flugt til sikker passage. Afslut med "SIGNAL RECEIVED — SOURCE UNKNOWN".

## UI og spillerfølelse
Kun korte interaktionsprompter tæt på objekter, journal med aktive mål, geografiske pejlemærker i stedet for konstante magiske waypoints. Kamerahøjde ~1,7 m, FOV ~75–80°, minimal head-bob. God læselighed og undertekster.

## Kvalitetsgrænse
Et fungerende render er ikke et færdigt visuelt design. Screenshots fra faktisk localhost-spil, virkelige testresultater og ejerens spiltest kræves for godkendelse.
