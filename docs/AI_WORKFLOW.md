# HOLLOW — Fast versionsbaseret AI-workflow

## Grundrytme

**ChatGPT designer Vn → Cursor implementerer Vn → Ejer spiller/tester Vn → ChatGPT designer Vn+1.**

ChatGPT er kreativ chefdesigner og uafhængig reviewer. Cursor er teknisk hovedudvikler. Ejer har endelig godkendelse.

## GitHub-regler

- Repository `Dartnation/hollow` er offentligt; undgå secrets og private data i alle commits, PR-beskrivelser og screenshots.
- `main` er kun til godkendte versioner. Bruger vi branches til kode, må Cursor ikke skubbe større ændringer direkte til main.
- Designspecifikationer versioneres; V1-filer bevares, også når V2 oprettes.
- Cursor åbner draft-PR, inkluderer faktisk testoutput og screenshots, undgår auto-merge.
- ChatGPT laver kritisk review med henvisning til konkrete krav/testevidens.
- Spilejeren tester kørende build, indsender rapport og giver explicit accept/reject.
- Godkendt release kan tagges `v1.0.0`, `v2.0.0` osv., men kun når koden faktisk er merged og testet.

## Definitioner

- **DESIGNED:** Dokumenter færdige, kode mangler.
- **IMPLEMENTED:** Kode findes og bygger, gameplay kan stadig fejle.
- **VERIFIED:** konkrete tests og playthrough-bevis.
- **OWNER_APPROVED:** bruger har spillet og godkendt.

## Typisk handoff efter hver version

- Game version + commit SHA + branche/PR.
- Aktuelle screenshots fra hver hero-shot position.
- Testkommando og faktisk output med tydelige PASS/FAIL/SKIPPED.
- Bugs sorteret efter blocker/major/minor.
- Ændringer fra forrige version og forklaring på designafvigelser.
- Playtestvejledning og kendte begrænsninger.

## Ingen falsk autonomi

En GitHub-forbindelse garanterer ikke baggrundssamarbejde. AI-agenter udveksler information, når nogen faktisk opretter/læser issues, PR'er eller filer. Ingen agent må hævde at den anden er blevet notificeret, har kørt, har set eller har godkendt noget, uden dokumentation.
