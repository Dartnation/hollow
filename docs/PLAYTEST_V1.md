# Hollow V1 — spiltest

Dette er den første spilbare nat, ikke en godkendt version. Spil den igennem og giv feedback til ChatGPT, før der arbejdes videre på V2.

## Start

```powershell
npm install
npm run dev
```

Åbn den adresse Vite skriver. Standard er `http://127.0.0.1:5183`. En anden port sættes med `PORT=5184` eller `npm run dev -- --port 5184`. Klik **Træd ind i skoven**, og lad browseren fange musen.

## Styring

- WASD går. Skift løber. C eller Ctrl dukker.
- Musen kigger. E bruger det, du ser på. F tænder lommelygten.
- Tab åbner journalen. Esc pauser, hvor lysstyrke, gem og indlæs ligger.
- Ved radioen drejer piletaster eller musehjul frekvensen. Hold E på antennen, til den låser.

## Det sidste signal

1. Lyt til bilradioen ved ankomsten. Underteksten er: `...station sytten... nogen der kan høre mig?`
2. Gå til skiltene. Broen til højre er kort og højlydt. Skrænten til venstre er længere og mere skjult. Begge kan fuldføre missionen.
3. Skiltet ved tjenesten lyder: `SKOVTJENESTEN — ANLÆG LUKKET`.
4. Åbn fordøren med E. Læs notesbogen: `Kun én kreds kan holdes aktiv. Lys eller sender.` Kanal 17, bærebølge nær 97,4.
5. Undersøg elpanelet, og send strømmen til radioen. Sikkerhedslyset slukker. De to kredse kan ikke være tændt samtidig.
6. Indstil radioen, til metret står i det hvide felt og suset bliver en tone. Målet er 97,4 MHz. Det er ikke en kode, der skal gættes i blinde.
7. Signalet brister. Gå ud til antennen ved passagen, og hold E, til den er låst.
8. Gå gennem passagen. Slutskærmen er `SIGNAL RECEIVED — SOURCE UNKNOWN` og linjen `Hvis du kan høre det her ... så er du allerede nået ind.`

Vogteren hører løb, trætrin og radioen. Den ser dig i en kegle, ikke gennem vægge, og den kan miste dig. Den åbner ikke døre. Bliver du grebet, starter du ved seneste checkpoint. Checkpoint 2 ligger i hytten, før strømvalget er låst.

Gemningen ligger i browserens `localStorage` under `hollow-v1-save` og kræver samme seed. Standardseed er 170147.

## Det, der er værd at mærke efter

- Om skoven, hytten og vogteren føles som en nat, eller stadig som programmeret kulisse.
- Om bro og skråning føles som to forskellige valg.
- Om radioen kan indstilles uden frustration, og om strømvalget er tydeligt.
- Om vogteren er fair: hører den det, du faktisk larmer med, og kan du slippe fra den.
- Om der er et sted, du kan sidde fast.
