import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';

import './design/reset.css';
import './design/tokens.css';
import './design/motion.css';
import './design/base.css';

import './components/primitives.js';
import './components/countdown.js';
import './components/value-card.js';
import './components/company-card.js';
import './components/bid-button.js';
import './components/credos-stack.js';
import './components/strategy-board.js';
import './components/act-timeline.js';
import './components/identity-card.js';
import './components/team-channel.js';

import './views/participant.js';
import './views/facilitator.js';
import './views/wall.js';

import { subscribeRoute } from './router.js';
import { Store } from './state/store.js';
import { initialSession } from './state/reducers.js';
import { createTransport, type Transport } from './transport/index.js';
import type { Action, Session } from './state/types.js';
import { shortId } from './utils/id.js';
import { announce } from './utils/a11y.js';

async function main() {
  const app = document.getElementById('app')!;
  const senderId = shortId();

  let currentTransport: Transport | undefined;
  let store: Store | undefined;
  let currentCode = '';
  let currentPath: 'join' | 'facilitate' | 'wall' = 'join';
  let mountedEl: HTMLElement | null = null;
  let mountedPath: 'join' | 'facilitate' | 'wall' | null = null;

  const ensureMount = (path: 'join' | 'facilitate' | 'wall', code: string) => {
    if (mountedPath === path && mountedEl) return mountedEl;
    app.innerHTML = '';
    let el: HTMLElement;
    if (path === 'facilitate') el = document.createElement('va-facilitator');
    else if (path === 'wall') el = document.createElement('va-wall');
    else el = document.createElement('va-participant');
    (el as any).sessionCode = code;
    app.appendChild(el);
    el.addEventListener('va-action', (e) => {
      const action = (e as CustomEvent).detail as Action;
      store?.dispatch(action);
    });
    mountedEl = el;
    mountedPath = path;
    return el;
  };

  const update = (state: Session) => {
    const el = ensureMount(currentPath, currentCode);
    (el as any).state = state;
    (el as any).sessionCode = currentCode;
  };

  const announceLastEvent = (prev: Session | undefined, next: Session) => {
    if (!prev || next.events.length === prev.events.length) return;
    const last = next.events[next.events.length - 1];
    if (last.type === 'bidPlaced') {
      const team = next.teams.find((t) => t.id === (last.payload as any).teamId);
      announce(`${team?.name ?? 'a team'} bid ${(last.payload as any).amount}`, 'assertive');
    }
    if (last.type === 'valueLocked') {
      announce('locked in.', 'assertive');
    }
    if (last.type === 'facilitatorBroadcast') {
      announce(`broadcast: ${(last.payload as any).message}`, 'polite');
    }
  };

  const teardownMount = () => {
    app.innerHTML = '';
    mountedEl = null;
    mountedPath = null;
  };

  const setup = async (path: 'join' | 'facilitate' | 'wall', code: string) => {
    const sameSession = code === currentCode && currentTransport;
    if (sameSession) {
      if (path !== currentPath) {
        teardownMount();
        currentPath = path;
        update(store!.getState());
      }
      return;
    }
    if (currentTransport) currentTransport.disconnect();
    teardownMount();
    currentCode = code;
    currentPath = path;

    const initial = initialSession(code, senderId, Date.now());
    const authoritative = path === 'facilitate';
    store = new Store(initial, { senderId, authoritative });

    let prev: Session | undefined;
    store.subscribe((s) => {
      update(s);
      announceLastEvent(prev, s);
      prev = s;
    });

    currentTransport = createTransport();
    await currentTransport.connect(code, path === 'facilitate' ? 'facilitator' : path === 'wall' ? 'wall' : 'participant');
    store.attachTransport(currentTransport);

    if (!authoritative) {
      // ask for a state snapshot. the facilitator listens for sync-request and replies with state.
      currentTransport.send({
        type: 'action',
        payload: { type: 'syncRequest', at: Date.now() } as any,
        at: Date.now(),
        sender: senderId,
      });
    } else {
      // broadcast initial state so late joiners catch up
      currentTransport.send({ type: 'state', payload: initial, at: Date.now(), sender: senderId });
    }
  };

  subscribeRoute(({ path, code }) => {
    setup(path, code).catch((err) => {
      console.error('transport connect failed', err);
      if (!store) {
        store = new Store(initialSession(code, senderId, Date.now()), {
          senderId,
          authoritative: path === 'facilitate',
        });
        store.subscribe((s) => update(s));
      }
    });
  });

  setTimeout(() => {
    const base = `${location.origin}${location.pathname}`;
    console.info('%cvalues auction', 'font-weight:700; color:#273248');
    console.info(`facilitator: ${base}#/facilitate?code=DEMO`);
    console.info(`participant: ${base}#/join?code=DEMO`);
    console.info(`wall:        ${base}#/wall?code=DEMO`);
  }, 200);
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:24px;color:#b15043">${(err as Error).stack}</pre>`;
});
