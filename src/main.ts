import { mount } from "./render/app";
import "./styles.css";

const canvas = document.querySelector("canvas");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Mangler lærred");
}

mount(canvas).catch((error: unknown) => {
  const note = document.createElement("p");
  note.id = "fatal";
  note.textContent = `Hollow kunne ikke starte. ${error instanceof Error ? error.message : String(error)}`;
  document.body.append(note);
});
