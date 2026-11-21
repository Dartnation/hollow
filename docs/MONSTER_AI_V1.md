# HOLLOW V1 — Monster-AI: Vogteren

## Karakter og formål
En asymmetrisk, menneskelignende skovskikkelse med ujævn bevægelse og tydelige stop, hvor den lytter. Opleves mest som silhuet blandt træerne. V1 lover **ikke fotorealisme**, men kræver genkendelig 3D-form, animation, kollision og sammenhængende adfærd.

## Sensorik
**Hørelse:** Eventbaseret stimulus `{type, position, intensity, time, sourceId}` for gang, løb, træbro, døre, generator og radio. Afstand, materiale og eventuelt vejr påvirker registrering. Ingen enkelt-stimulus-per-frame-spam.

**Syn:** Synsfelt, afstand, synslinjekontrol via raycast og lysforhold. Skjulte spillere uden synslinje må ikke automatisk registreres.

**Hukommelse:** Gem `lastKnownPlayerPosition`, `lastStimulusPosition` og tidsstempler. Hukommelse svækkes; uden ny stimulus søger monstret lokalt, før det vender til patrulje.

## Tilstandsmaskine
`IDLE` → `PATROL` → `SUSPICIOUS` → `INVESTIGATE` → `SEARCH` → `CHASE` → `ATTACK` → `LOST_TARGET` → `RETURN`.

Transitions afhænger af målbare stimuli og timers. CHASE kræver gyldig detektion; et tab af sigte fører til last-known-position-søgning, ikke teleport eller magisk tracking.

## Navigation
Benyt dokumenteret navigation eller pathfinding, der respekterer terræn, vægge, broer, døre og andre hindringer. Replan ved blokering. Angreb kræver faktisk rækkevidde og kontakt. Test via reproducerbare seeds.

## Gameplay
- Brotrin kan øge mistanke, selvom spilleren endnu ikke er set.
- Radio/generator kan lokke Vogteren mod hytten.
- Dækning, dukning og rolig bevægelse skal give spilleren en chance.
- Monsteret må ikke spawne oven på spilleren, åbne umulige døre eller se gennem lukkede vægge.
- Jagt må skabe spænding, men aldrig automatisk uundgåeligt tab.

## Testscenarier
1. Monsteret hører broen uden at kende spillerens aktuelle position.
2. Mister synslinje og søger ved sidste kendte position.
3. Ignorerer støjsvage stimuli uden for relevant radius.
4. Navigerer omkring en hytte uden at gå gennem væggen.
5. Kan opgive forfølgelse og vende tilbage.
6. Efter checkpoint genindlæses konsistent og uden softlock.

Alle beståede testkrav dokumenteres med faktisk testresultat, ikke antagelser.
