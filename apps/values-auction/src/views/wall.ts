import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Controller } from '@/state/controller';
import type { Session } from '@/state/types';
import { COPY } from '@/content/copy';
import { getValue } from '@/content/values';
import { totalParticipants } from '@/state/selectors';
import '@/components/countdown';
import '@/components/value-card';
import '@/components/identity-card';

@customElement('va-wall')
export class VaWall extends LitElement {
  @property({ attribute: false }) controller?: Controller;
  @property({ type: String }) code = 'DEMO';

  @state() private session?: Session;
  private unsub?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this.unsub = this.controller?.store.subscribe((s) => (this.session = s));
    this.session = this.controller?.store.getState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      padding: var(--space-6);
    }
    .centre {
      min-height: calc(100vh - var(--space-6) * 2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .wordmark {
      height: 80px;
      margin-bottom: var(--space-6);
    }
    .code {
      font: var(--type-mono);
      font-size: 72px;
      color: var(--wv-cadet-blue);
      background: var(--bg-card);
      padding: var(--space-4) var(--space-6);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      letter-spacing: 0.2em;
    }
    .count {
      margin-top: var(--space-5);
      font: var(--type-display);
      color: var(--fg-muted);
    }
    .auction {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
      align-items: center;
      justify-items: center;
      min-height: calc(100vh - var(--space-6) * 2);
      padding: var(--space-5);
    }
    .auction .big-card {
      max-width: 900px;
    }
    .auction .high {
      font: var(--type-display);
      font-size: 56px;
    }
    .auction .colour-block {
      display: block;
      width: 100%;
      height: 60px;
      border-radius: var(--radius-md);
      margin-top: var(--space-4);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-5);
      padding: var(--space-5);
    }
  `;

  private renderIdle() {
    return html`
      <div class="centre">
        <img class="wordmark" src="/wordmark.svg" alt="winded.vertigo" />
        <div class="code" aria-label=${COPY.wall.joinAt(this.code)}>${this.code}</div>
        <div class="count">${totalParticipants(this.session!)} joined</div>
      </div>
    `;
  }

  private renderAuction() {
    const auction = this.session?.currentAuction;
    if (!auction) return this.renderIdle();
    const v = getValue(auction.valueId);
    const highTeam = this.session?.teams.find((t) => t.id === auction.highBid?.teamId);
    return html`
      <div class="auction">
        <div class="big-card">
          <va-value-card .value=${v} zone="must" large></va-value-card>
        </div>
        <va-countdown
          ring
          .startedAt=${auction.startedAt}
          .durationMs=${auction.durationMs}
        ></va-countdown>
        ${highTeam && auction.highBid
          ? html`
              <div class="high" aria-live="polite">
                ${highTeam.name}: ${auction.highBid.amount} credos
                <span
                  class="colour-block"
                  style=${`background: var(--team-${highTeam.colour})`}
                ></span>
              </div>
            `
          : html`<div class="high" style="color: var(--fg-muted)">${COPY.auction.noBidsYet}</div>`}
      </div>
    `;
  }

  private renderReflection() {
    if (!this.session) return html``;
    return html`
      <div class="grid">
        ${this.session.teams.map(
          (t) => html`<va-identity-card .team=${t}></va-identity-card>`,
        )}
      </div>
    `;
  }

  private renderRegather() {
    if (!this.session) return html``;
    const valueWinners = new Map<string, number>();
    for (const a of this.session.completedAuctions) {
      if (a.winnerTeamId) valueWinners.set(a.valueId, (valueWinners.get(a.valueId) ?? 0) + 1);
    }
    return html`
      <div class="centre">
        <h1 style="font: var(--type-display); margin-bottom: var(--space-5)">
          patterns across the room
        </h1>
        <div class="grid">
          ${Array.from(valueWinners.entries()).map(([valueId, count]) => {
            const v = getValue(valueId);
            return v
              ? html`<va-card><h2>${v.name}</h2><p>${count} team${count === 1 ? '' : 's'}</p></va-card>`
              : '';
          })}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.session) return html`<p>loading…</p>`;
    const act = this.session.currentAct;
    if (act === 'auction') return this.renderAuction();
    if (act === 'reflection') return this.renderReflection();
    if (act === 'regather') return this.renderRegather();
    return this.renderIdle();
  }
}
