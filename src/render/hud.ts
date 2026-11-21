import { COPY, OBJECTIVE } from "../sim/balance";
import type { GameSim } from "../sim/game";

export class Hud {
  readonly root: HTMLElement;
  private title: HTMLElement;
  private prompt: HTMLElement;
  private subtitle: HTMLElement;
  private banner: HTMLElement;
  private journal: HTMLElement;
  private pause: HTMLElement;
  private death: HTMLElement;
  private ending: HTMLElement;
  private tune: HTMLElement;
  private hold: HTMLElement;

  constructor(private readonly sim: GameSim, private readonly onStart: () => void, private readonly onBrightness: (value: number) => void) {
    this.root = document.createElement("div");
    this.root.id = "ui";
    this.root.innerHTML = `
      <div id="title">
        <p class="eyebrow">00:47 · Skovtjenesten</p>
        <h1>HOLLOW</h1>
        <p class="night">Den første nat</p>
        <p class="lead">Et nødkald er stadig i luften. Nogen i skoven beder om hjælp — eller om at blive hørt.</p>
        <button id="enter" type="button">Træd ind i skoven</button>
        <p class="keys">WASD gå · Skift løb · C / Ctrl duk · E brug · F lygte · Tab journal · Esc pause</p>
      </div>
      <div id="banner"></div>
      <div id="prompt"></div>
      <div id="subtitle"></div>
      <div id="hold"><span></span></div>
      <div id="tune">
        <p>Frekvens</p>
        <strong id="mhz">92.0</strong>
        <div class="meter"><i id="needle"></i><em></em></div>
        <small>Hvidt felt låser bærebølgen. Piletaster eller musehjul.</small>
      </div>
      <aside id="journal"></aside>
      <section id="pause">
        <h2>Pause</h2>
        <label>Lysstyrke <input id="bright" type="range" min="0.7" max="1.7" step="0.02" value="1.32" /></label>
        <button id="resume" type="button">Fortsæt</button>
        <button id="save" type="button">Gem</button>
        <button id="load" type="button">Indlæs</button>
      </section>
      <section id="death"><h2>Den fandt dig.</h2><p>Checkpoint genindlæses.</p></section>
      <section id="ending">
        <p class="eyebrow">M01</p>
        <h2>${COPY.ending}</h2>
        <p>${COPY.paradox}</p>
      </section>
    `;
    this.title = this.by("#title");
    this.prompt = this.by("#prompt");
    this.subtitle = this.by("#subtitle");
    this.banner = this.by("#banner");
    this.journal = this.by("#journal");
    this.pause = this.by("#pause");
    this.death = this.by("#death");
    this.ending = this.by("#ending");
    this.tune = this.by("#tune");
    this.hold = this.by("#hold");
    this.by("#enter").addEventListener("click", () => this.onStart());
    this.by("#resume").addEventListener("click", () => {
      this.sim.paused = false;
    });
    this.by("#save").addEventListener("click", () => localStorage.setItem("hollow-v1-save", this.sim.serialize()));
    this.by("#load").addEventListener("click", () => {
      const raw = localStorage.getItem("hollow-v1-save");
      if (raw) this.sim.load(raw);
    });
    this.by("#bright").addEventListener("input", (event) => {
      const value = Number((event.target as HTMLInputElement).value);
      this.onBrightness(value);
    });
  }

  mount(parent: HTMLElement): void {
    parent.append(this.root);
  }

  setVisible(visible: boolean): void {
    this.root.classList.toggle("hidden", !visible);
  }

  update(): void {
    const view = this.sim.snapshot();
    this.root.dataset.mission = view.mission;
    this.root.dataset.mode = view.mode;
    this.title.classList.toggle("show", !this.sim.started);
    this.prompt.textContent = view.prompt ? `E  ${view.prompt}` : "";
    this.subtitle.textContent = view.subtitle ?? "";
    this.banner.textContent = view.banner ?? "";
    this.tune.classList.toggle("show", view.tuning);
    this.by("#mhz").textContent = view.mhz.toFixed(1);
    const needle = this.by("#needle");
    needle.style.left = `${((view.mhz - 88) / 20) * 100}%`;
    this.hold.classList.toggle("show", view.antennaHold > 0 && view.antennaHold < 1);
    this.hold.querySelector("span")?.setAttribute("style", `width:${view.antennaHold * 100}%`);
    this.journal.classList.toggle("show", view.journal);
    this.pause.classList.toggle("show", view.paused);
    this.death.classList.toggle("show", view.mode === "dead");
    this.ending.classList.toggle("show", view.mode === "complete");
    if (view.journal) this.journal.innerHTML = this.journalHtml(view);
  }

  private journalHtml(view: ReturnType<GameSim["snapshot"]>): string {
    const route = view.route === "bridge" ? "Broen — du valgte den korte, højlydte vej." : view.route === "slope" ? "Skrænten — du valgte den lange, skjulte vej." : "Du har ikke valgt vej endnu.";
    const power = view.lights ? "Sikkerhedslys tændt. Senderen er død." : "Senderen har strøm. Sikkerhedslyset er slukket.";
    const note = view.notebook ? COPY.notebook : "Notesbogen er ikke læst.";
    return `<h2>M01 · Det sidste signal</h2><p>${OBJECTIVE[view.mission] ?? ""}</p><h3>Rute</h3><p>${route}</p><h3>Strøm</h3><p>${power}</p><h3>Note</h3><p>${note}</p>`;
  }

  private by(selector: string): HTMLElement {
    const node = this.root.querySelector(selector);
    if (!(node instanceof HTMLElement)) throw new Error(`Mangler ${selector}`);
    return node;
  }
}
