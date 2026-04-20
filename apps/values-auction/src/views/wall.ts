import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Session } from '../state/types.js';
import { getValue } from '../content/values.js';
import { patternByValue } from '../state/selectors.js';
import { wordmark } from '../components/icons.js';

@customElement('va-wall')
export class VaWall extends LitElement {
  @property({ attribute: false }) state!: Session;
  @property({ type: String }) sessionCode = '';

  static override styles = css`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--bg-deep);
      color: var(--fg-inverse);
      font: var(--type-body);
    }
    .stage {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: var(--space-7);
      text-align: center;
    }
    .code {
      font: var(--type-mono);
      font-size: clamp(40px, 8vw, 72px);
      margin-top: var(--space-5);
    }
    .count {
      margin-top: var(--space-5);
      font-size: clamp(18px, 2vw, 24px);
      opacity: 0.7;
    }
    .auction {
      display: grid;
      place-items: center;
      gap: var(--space-6);
    }
    .big-name {
      font: var(--type-display);
      font-size: clamp(48px, 8vw, 120px);
      line-height: 1;
    }
    .bid {
      font-size: clamp(24px, 4vw, 48px);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-pill);
      background: var(--accent-urgent);
    }
    .ring-wrap { transform: scale(2.5); }
    .grid-cards {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      padding: var(--space-6);
    }
    .pattern {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      padding: var(--space-6);
    }
    .pattern-tile {
      background: rgba(255,255,255,0.05);
      padding: var(--space-4);
      border-radius: var(--radius-md);
    }
    .pattern-tile strong { display: block; font-size: 18px; margin-bottom: var(--space-2); }
  `;

  override render() {
    if (!this.state) return html`<p>loading...</p>`;
    const s = this.state;

    if (s.currentAct === 'auction' && s.currentAuction && !s.currentAuction.lockedIn) {
      const a = s.currentAuction;
      const v = getValue(a.valueId);
      const highTeam = a.highBid ? s.teams.find((t) => t.id === a.highBid!.teamId) : null;
      return html`
        <div class="stage auction">
          <div class="big-name">${v?.name}</div>
          <div class="ring-wrap">
            <va-countdown ring .startedAt=${a.startedAt} .durationMs=${a.durationMs}></va-countdown>
          </div>
          <div class="bid" aria-live="assertive">
            ${a.highBid ? html`${a.highBid.amount} credos \u2022 ${highTeam?.name}` : 'awaiting first bid'}
          </div>
        </div>
      `;
    }

    if (s.currentAct === 'reflection') {
      return html`
        <div class="grid-cards">
          ${s.teams.map((t) => html`
            <va-company-card
              .startupId=${t.startupId}
              .wonValues=${t.wonValues}
              .purposeStatement=${t.purposeStatement ?? ''}
              .teamName=${t.name}
            ></va-company-card>
          `)}
        </div>
      `;
    }

    if (s.currentAct === 'regather') {
      const pattern = patternByValue(s);
      const entries = Object.entries(pattern).sort((a, b) => b[1].length - a[1].length);
      return html`
        <div style="padding: var(--space-5); text-align: center">
          <h1 style="font: var(--type-display)">what did we choose?</h1>
        </div>
        <div class="pattern">
          ${entries.map(([vid, tids]) => html`
            <div class="pattern-tile">
              <strong>${getValue(vid)?.name}</strong>
              <span>${tids.length} team${tids.length === 1 ? '' : 's'}</span>
            </div>
          `)}
        </div>
      `;
    }

    return html`
      <div class="stage">
        ${wordmark}
        <div class="code">${this.sessionCode}</div>
        <div class="count">${s.participants.length} people in the room \u2022 ${s.teams.length} teams</div>
      </div>
    `;
  }
}
