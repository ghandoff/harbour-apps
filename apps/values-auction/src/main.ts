import '@/design/reset.css';
import '@/design/tokens.css';
import '@/design/base.css';
import '@/design/motion.css';

import { currentRoute, onRouteChange, navigate } from '@/router';
import { createController, type Controller } from '@/state/controller';
import { exportIdentityCard } from '@/identity-card/render';

import '@/views/participant';
import '@/views/facilitator';
import '@/views/wall';

const app = document.getElementById('app');
if (!app) throw new Error('missing #app mount point');

let controller: Controller | null = null;

async function render() {
  const route = currentRoute();
  if (!controller || controller.store.getState().id !== route.code) {
    controller?.destroy();
    const role =
      route.route === 'facilitate'
        ? 'facilitator'
        : route.route === 'wall'
          ? 'wall'
          : 'participant';
    controller = await createController(route.code, role);
  }

  if (route.route === 'landing') {
    app!.innerHTML = `
      <main style="padding: var(--space-6); max-width: 640px; margin: 0 auto;">
        <img src="/wordmark.svg" alt="winded.vertigo" style="height: 48px; margin-bottom: var(--space-5);" />
        <h1 style="font: var(--type-display); margin-bottom: var(--space-5);">values auction</h1>
        <p style="margin-bottom: var(--space-5);">a live, facilitator-driven classroom game. play for what matters.</p>
        <div style="display: flex; flex-direction: column; gap: var(--space-3);">
          <a href="#/facilitate?code=DEMO">open facilitator · demo</a>
          <a href="#/join?code=DEMO">join as participant · demo</a>
          <a href="#/wall?code=DEMO">open wall · demo</a>
        </div>
      </main>
    `;
    return;
  }

  app!.innerHTML = '';
  let view: HTMLElement;
  if (route.route === 'join') {
    const el = document.createElement('va-participant') as HTMLElement & {
      controller: Controller;
      code: string;
    };
    el.controller = controller!;
    el.code = route.code;
    view = el;
  } else if (route.route === 'facilitate') {
    const el = document.createElement('va-facilitator') as HTMLElement & {
      controller: Controller;
      code: string;
    };
    el.controller = controller!;
    el.code = route.code;
    view = el;
  } else {
    const el = document.createElement('va-wall') as HTMLElement & {
      controller: Controller;
      code: string;
    };
    el.controller = controller!;
    el.code = route.code;
    view = el;
  }
  app!.appendChild(view);
}

window.addEventListener('load', () => {
  if (!window.location.hash) navigate('landing');
  render();
});

onRouteChange(() => render());

// global handler: identity card download
document.addEventListener('va-download-card', async (e: Event) => {
  const detail = (e as CustomEvent).detail as { teamId: string };
  if (!controller) return;
  const team = controller.store.getState().teams.find((t) => t.id === detail.teamId);
  if (!team) return;
  await exportIdentityCard(team);
});

// global handler: auction timeout → end it (authoritative client only)
setInterval(() => {
  if (!controller || !controller.isAuthoritative()) return;
  const s = controller.store.getState();
  const a = s.currentAuction;
  if (!a || a.lockedIn) return;
  const elapsed = Date.now() - a.startedAt;
  if (elapsed >= a.durationMs) {
    controller.dispatch({ type: 'AUCTION_END', at: Date.now() });
  }
}, 500);

// eslint-disable-next-line no-console
console.log('[values-auction] open:');
// eslint-disable-next-line no-console
console.log('  facilitator → #/facilitate?code=DEMO');
// eslint-disable-next-line no-console
console.log('  participant → #/join?code=DEMO');
// eslint-disable-next-line no-console
console.log('  wall        → #/wall?code=DEMO');
