// fx/anim.js
const fract = (x) => x - Math.floor(x);
const hash = (n) => fract(Math.sin(n * 127.1) * 43758.5453);

function createFlicker(mats, { base = 1, seed = 0, amp = 0.06, blinkChance = 0.09 } = {}) {
  const bases = mats.map((m) => m.color.clone());
  return {
    update(t) {
      const slow = Math.sin(t * 2.7 + seed) * amp + Math.sin(t * 6.1 + seed * 2.1) * amp * 0.5;
      const slot = Math.floor(t * 1.4);
      const h = hash(slot + seed * 31.7);
      let mul = base + slow;
      if (h < blinkChance) {
        const local = fract(t * 1.4);
        const blink = local < 0.28 ? (Math.sin(t * 70 + seed) > 0 ? 0.35 : 1.0) : 1.0;
        mul *= blink;
      }
      mats.forEach((m, i) => {
        m.color.copy(bases[i]).multiplyScalar(Math.max(0.1, mul));
      });
    },
  };
}

function createDoor(door, { closed, open, floorY, zClosed, zOpen }) {
  let phase = Math.random() * 6;
  let state = 0;
  let t0 = 0;
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  return {
    led: null,
    update(t, dt) {
      phase += dt;
      if (state === 0 && phase > 7 + Math.random() * 6) {
        state = 1;
        t0 = t;
      } else if (state === 1 && t - t0 > 0.7) {
        state = 2;
        t0 = t;
      } else if (state === 2 && t - t0 > 3.2) {
        state = 3;
        t0 = t;
      } else if (state === 3 && t - t0 > 0.7) {
        state = 0;
        phase = 0;
      }
      let k = 0;
      if (state === 1) k = ease(Math.min(1, (t - t0) / 0.7));
      else if (state === 2) k = 1;
      else if (state === 3) k = 1 - ease(Math.min(1, (t - t0) / 0.7));
      door.panels.forEach((p, i) => {
        const target = state === 0 || state === 3 ? closed[i] : open[i];
        const from = closed[i];
        const to = open[i];
        void target;
        p.position.x = from + (to - from) * k;
      });
      return k > 0.05;
    },
  };
}

function createSignal(sig) {
  const NS_G = 0, NS_Y = 1, ALL_R1 = 2, EW_G = 3, EW_Y = 4, ALL_R2 = 5;
  const durations = [6.5, 1.6, 0.4, 6.0, 1.6, 0.4];
  let st = 0;
  let acc = 0;
  const off = { r: 0.06, g: 0.06, b: 0.06 };
  const setLamps = (lamps, active) => {
    lamps.forEach((l, i) => {
      const col = i === active ? l.on : l.off;
      l.mat.color.copy(col);
    });
  };
  return {
    update(dt) {
      acc += dt;
      if (acc > durations[st]) {
        acc = 0;
        st = (st + 1) % durations.length;
      }
      let ns = -1,
        ew = -1;
      if (st === NS_G) ns = 0;
      else if (st === NS_Y) ns = 1;
      else if (st === EW_G) ew = 0;
      else if (st === EW_Y) ew = 1;
      setLamps(sig.headNS, ns);
      setLamps(sig.headEW, ew);
      const nsOn = ns === 0,
        ewOn = ew === 0;
      sig.pedNS.red.color.set(nsOn ? 0x222222 : 0xffffff);
      sig.pedNS.grn.color.set(nsOn ? 0xffffff : 0x222222);
      sig.pedEW.red.color.set(ewOn ? 0x222222 : 0xffffff);
      sig.pedEW.grn.color.set(ewOn ? 0xffffff : 0x222222);
      sig.nsLight.color.set(nsOn ? 0x40e0a0 : ns === 1 ? 0xffc040 : 0xff3a2a);
      sig.nsLight.intensity = 3.2;
      sig.ewLight.color.set(ewOn ? 0x40e0a0 : ew === 1 ? 0xffc040 : 0xff3a2a);
      sig.ewLight.intensity = 3.2;
      void off;
    },
  };
}

export { createFlicker, createDoor, createSignal };
