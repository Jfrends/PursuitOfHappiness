// /src/components/Scrubber.js
import { html } from "npm:htl";

export function Scrubber(values, {
  format = value => value,
  initial = 0,
  delay = null,
  autoplay = true,
  loop = true,
  loopDelay = null,
  alternate = false,
  label = null // <-- Supports your "Timeline" label
} = {}) {
  values = Array.from(values);
  
  const form = html`<form style="font: 12px var(--sans-serif); font-variant-numeric: tabular-nums; display: flex; height: 33px; align-items: center;">
    ${label ? html`<span style="margin-right: 0.5em; font-weight: bold;">${label}</span>` : ""}
    <button name=b type=button style="margin-right: 0.4em; width: 5em;"></button>
    <label style="display: flex; align-items: center;">
      <input name=i type=range min=0 max=${values.length - 1} value=${initial} step=1 style="width: 180px;">
      <output name=o style="margin-left: 0.4em;"></output>
    </label>
  </form>`;

  let timer = null;
  let direction = 1;

  function update() {
    form.value = values[form.i.valueAsNumber];
    form.o.value = format(form.value, form.i.valueAsNumber, values);
    form.dispatchEvent(new CustomEvent("input", {bubbles: true}));
  }

  function step() {
    form.i.valueAsNumber = (form.i.valueAsNumber + direction + values.length) % values.length;
    update();
  }

  form.i.oninput = event => {
    if (event && event.isTrusted && timer) form.b.onclick();
    update();
  };

  form.b.onclick = () => {
    if (timer) return stop();
    direction = alternate && form.i.valueAsNumber === values.length - 1 ? -1 : 1;
    form.i.valueAsNumber = (form.i.valueAsNumber + direction) % values.length;
    form.b.textContent = "Pause";
    update();
    start();
  };

  form.i.oninput();

  function start() {
    form.b.textContent = "Pause";
    timer = delay === null
      ? requestAnimationFrame(function tick() {
          step();
          if (form.i.valueAsNumber === (direction > 0 ? values.length - 1 : 0)) {
            if (!loop) return stop();
            if (alternate) direction = -direction;
          }
          timer = requestAnimationFrame(tick);
        })
      : setInterval(function() {
          step();
          if (form.i.valueAsNumber === (direction > 0 ? values.length - 1 : 0)) {
            if (!loop) return stop();
            if (alternate) direction = -direction;
          }
        }, delay);
  }

  function stop() {
    form.b.textContent = "Play";
    if (delay === null) cancelAnimationFrame(timer);
    else clearInterval(timer);
    timer = null;
  }

  if (autoplay) start();
  else stop();

  return form;
}