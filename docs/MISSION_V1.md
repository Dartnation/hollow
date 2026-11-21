# HOLLOW V1 — Mission M01: Det sidste signal

## Mission
Genetablér et nødsignal fra skovfogedstationen, undgå en trussel og nå en sikker passage. Designmål: 10–15 min.

| State | Spillermål | Transition |
|---|---|---|
| `ARRIVAL` | Find nødkaldets kilde | Når forgreningen/hytten lokaliseres |
| `APPROACH` | Nå skovfogedstationen | Når spilleren kommer ind |
| `INSPECT_POWER` | Undersøg strømfordelingen | Når elpanelet inspiceres |
| `DIVERT_POWER` | Send strøm til radio | Ved `RADIO_ON` og `EXTERIOR_LIGHTS_OFF` |
| `TUNE_SIGNAL` | Indstil radioens frekvens | Feedback matcher, transmission starter |
| `REPAIR_LINK` | Fastlås antenneforbindelsen ved skuret | Udendørs kontakt aktiveret |
| `ESCAPE` | Nå sikker passage | Passage nået |
| `COMPLETE` | M01 fuldført | Missionstatus og afslutning gemt |

Disse tilstande skal føles som sammenhængende handlinger, ikke kedelige checklistpunkter.

## Systemiske regler
- **Rutevalg:** Træbro udløser kraftigt `wood_footstep`, som Vogteren kan høre; skovskråning har mere skjul, men tager længere tid. Begge ruter skal kunne gennemføres.
- **Strøm:** Når radioen får strøm, mister udvendige sikkerhedslys strøm. Lys, lyde, brugerfeedback og AI-relevante forhold skal ændres i samme state transition.
- **Radio:** Frekvensen justeres med auditiv og visuel feedback, ikke ved et arbitrært kodegæt.
- **Antenne:** Radioen mister tydeligt forbindelse, så spilleren forstår nødvendigheden af skurreparation.
- **AI-pres:** Radio, generator, bro og døre genererer høre-events med position og intensitet. Monsteret har ikke adgang til en skjult altid-kendt spillerposition.
- **Flugt:** Skjul ved veranda eller terræn kan bryde synslinje. Sprint giver fart, men mere lyd.

## Checkpoints og fejlsikring
1. Ved ankomst.
2. Ved hytten inden risikofasen.
3. Ved begyndelsen af `ESCAPE`.

Død/fangst genstarter deterministisk ved sidste checkpoint. Døre må ikke permanent blokere missionen. Panel må gerne undersøges tidligere end journalen. Forkert rutevalg må aldrig softlocke. Save/load skal bevare mission-state, power-state, dørstate og checkpoint.

## Originale narrative udkast
- Bilradio: "...station sytten... nogen der kan høre mig?"
- Skilt: "SKOVTJENESTEN — ANLÆG LUKKET"
- Journal: "Kun én kreds kan holdes aktiv. Lys eller sender."
- Afsløring: "Hvis du kan høre det her ... så er du allerede nået ind."

Undertekster er obligatoriske; hvis voice-MP3 ikke findes, vis tekst og brug lovligt tilgængelige effekter.

## Definition of done
Missionen kan fuldføres via begge ruter. Strømvalget ændrer faktisk lys og progression. Monstret reagerer på relevante lyde, kan miste spilleren og forhindrer ikke uretfærdigt progression. En reel slutning og genindlæsning fungerer.
