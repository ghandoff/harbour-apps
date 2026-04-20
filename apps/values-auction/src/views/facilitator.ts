import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Session, Action, ActId } from '../state/types.js';
import { nextAct } from '../content/acts.js';
import { getValue } from '../content/values.js';
import { STARTUPS } from '../content/startups.js';
import { shortId, teamColour, teamNameFor } from '../utils/id.js';
import { bidVelocity, silentTeams, remainingMs } from '../state/selectors.js';
import { formatClock } from '../utils/timer.js';
import { wordmark } from '../components/icons.js';

@customElement('va-facilitator')
export class VaFacilitator extends LitElement {
  @property({ attribute: false }) state!: Session;
  @property({ type: String }) sessionCode = '';

  @state() private now = Date.now();
  @state() private onBlockValueId: string | null = null;
  @state() private broadcastText = '';
  @state() private showJumpConfirm: ActId | null = null;
  private ticker?: number;

  override connectedCallback() {
    super.connectedCallback();
    this.ticker = window.setInterval(() => (this.now = Date.now()), 500);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.ticker) clearInterval(this.ticker);
  }

  static override styles = css`
    :host { display: block; min-height: 100dvh; }
    .app {
      display: grid;
      grid-template-columns: 260px 1fr 320px;
      min-height: 100dvh;
      gap: var(--space-4);
      padding: var(--space-4);
    }
    @media (max-width: 1100px) { .app { grid-template-columns: 1fr; } }
    header.bar {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--bg-card);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-3);
    }
    .pane {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-card);
      overflow-y: auto;
    }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: var(--space-3); opacity: 0.7; }
    .kpi { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
    .kpi .tile { padding: var(--space-3); border-radius: var(--radius-sm); background: var(--wv-champagne); }
    .kpi .tile strong { font-size: 22px; }
    .team-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid rgba(39, 50, 72, 0.06);
    }
    .deck {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-2);
    }
    .deck button {
      background: var(--wv-champagne);
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      padding: var(--space-2) var(--space-3);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
    }
    .deck button.onblock { border-color: var(--accent-urgent); }
    .onblock-slot {
      padding: var(--space-4);
      background: var(--wv-champagne);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }
    .modal {
      position: fixed; inset: 0;
      display: grid; place-items: center;
      background: rgba(39, 50, 72, 0.4);
      z-index: 20;
    }
    .modal .box {
      background: var(--bg-card);
      padding: var(--space-5);
      border-radius: var(--radius-md);
      max-width: 420px;
    }
    input[type='text'] {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      border: 1px solid rgba(39, 50, 72, 0.2);
      width: 100%;
      font: var(--type-body);
    }
    .tools { display: flex; gap: var(--space-2); flex-wrap: wrap; }
  `;

  private dispatch(action: Action) {
    this.dispatchEvent(new CustomEvent('va-action', { detail: action, bubbles: true, composed: true }));
  }

  private advance() {
    const next = nextAct(this.state.currentAct);
    if (!next) return;
    this.dispatch({ type: 'advanceAct', to: next, at: Date.now() });
  }

  private jumpTo(to: ActId) {
    this.showJumpConfirm = to;
  }

  private confirmJump() {
    if (this.showJumpConfirm) {
      this.dispatch({ type: 'advanceAct', to: this.showJumpConfirm, at: Date.now() });
      this.showJumpConfirm = null;
    }
  }

  private autoAssignTeams() {
    const archetypes = this.state.participants.filter((p) => p.archetype);
    if (archetypes.length === 0) return;
    const perTeam = Math.max(1, Math.min(5, Math.ceil(archetypes.length / Math.min(8, Math.ceil(archetypes.length / 3)))));
    const teamCount = Math.min(8, Math.ceil(archetypes.length / perTeam));
    const buckets: string[][] = Array.from({ length: teamCount }, () => []);
    archetypes.forEach((p, i) => buckets[i % teamCount].push(p.id));
    const assignments = buckets.map((ids, i) => ({
      teamId: `team-${shortId()}`,
      name: teamNameFor(teamColour(i)),
      colour: teamColour(i),
      startupId: STARTUPS[i % STARTUPS.length].id,
      participantIds: ids,
    }));
    this.dispatch({ type: 'assignTeams', assignments, at: Date.now() });
  }

  private extend(ms: number) {
    this.dispatch({ type: 'extendAct', addMs: ms, at: Date.now() });
  }

  private broadcast() {
    const m = this.broadcastText.trim();
    if (!m) return;
    this.dispatch({ type: 'broadcast', message: m, at: Date.now() });
    this.broadcastText = '';
  }

  private startAuction(valueId: string) {
    this.dispatch({ type: 'startAuction', valueId, durationMs: 30_000, at: Date.now() });
  }

  private lockIn() {
    this.dispatch({ type: 'lockIn', at: Date.now() });
  }

  override render() {
    if (!this.state) return html`<p>loading...</p>`;
    const s = this.state;
    const velocity = bidVelocity(s, 60_000, this.now);
    const silent = silentTeams(s, 60_000, this.now);
    const actRemaining = remainingMs(s, this.now);

    return html`
      <div class="app">
        <header class="bar">
          <div style="display: flex; align-items: center; gap: var(--space-4)">
            ${wordmark}
            <span style="font: var(--type-mono)">session ${this.sessionCode}</span>
          </div>
          <va-act-timeline
            interactive
            .current=${s.currentAct}
            @jump-act=${(e: CustomEvent) => this.jumpTo(e.detail.to)}
          ></va-act-timeline>
          <div style="display: flex; gap: var(--space-2); align-items: center">
            <va-countdown .startedAt=${s.actStartedAt ?? 0} .durationMs=${s.actDurationMs}></va-countdown>
            <va-button variant="ghost" @click=${() => this.extend(60_000)}>+1 min</va-button>
            <va-button variant="primary" @click=${() => this.advance()}>next act \u2192</va-button>
          </div>
        </header>

        <aside class="pane">
          <h2>live signal</h2>
          <div class="kpi">
            <div class="tile"><div>teams</div><strong>${s.teams.length}</strong></div>
            <div class="tile"><div>people</div><strong>${s.participants.length}</strong></div>
            <div class="tile"><div>bids / min</div><strong>${velocity.toFixed(1)}</strong></div>
            <div class="tile"><div>silent</div><strong>${silent.length}</strong></div>
          </div>
          <h2>credos</h2>
          ${[...s.teams].sort((a, b) => b.credos - a.credos).map((t) => html`
            <div class="team-row">
              <span>${t.name}</span>
              <strong>${t.credos}</strong>
            </div>
          `)}
        </aside>

        <main class="pane">
          <h2>stage</h2>
          ${this.renderStage()}
          <div style="margin-top: var(--space-5)">
            <h2>broadcast</h2>
            <form style="display:flex; gap: var(--space-2)" @submit=${(e: Event) => { e.preventDefault(); this.broadcast(); }}>
              <label class="sr-only" for="broadcast">broadcast message</label>
              <input
                id="broadcast"
                type="text"
                placeholder="push a sentence to every participant"
                .value=${this.broadcastText}
                @input=${(e: Event) => (this.broadcastText = (e.target as HTMLInputElement).value)}
              />
              <va-button variant="primary" type="submit" @click=${() => this.broadcast()}>send</va-button>
            </form>
          </div>
          <div style="margin-top: var(--space-5)">
            <h2>tools</h2>
            <div class="tools">
              ${s.currentAct === 'grouping' && s.teams.length === 0
                ? html`<va-button variant="primary" @click=${() => this.autoAssignTeams()}>auto-assign teams</va-button>`
                : null}
              <va-button variant="ghost" @click=${() => this.extend(30_000)}>extend 30s</va-button>
              <va-button variant="ghost" @click=${() => this.dispatch({
                type: 'pauseSession',
                paused: !s.paused,
                at: Date.now(),
              })}>${s.paused ? 'resume' : 'pause'}</va-button>
            </div>
          </div>
        </main>

        <aside class="pane">
          <h2>deck (${s.valueDeck.length} left)</h2>
          ${s.currentAct === 'auction'
            ? html`
                ${s.currentAuction && !s.currentAuction.lockedIn
                  ? html`
                      <div class="onblock-slot">
                        <strong>${getValue(s.currentAuction.valueId)?.name}</strong>
                        <div>high: ${s.currentAuction.highBid?.amount ?? '\u2014'}</div>
                        <div>${formatClock(actRemaining)}</div>
                        <va-button variant="urgent" @click=${() => this.lockIn()}>lock in</va-button>
                      </div>
                    `
                  : html`<p style="opacity:0.7">pick a card below to put on the block.</p>`}
                <div class="deck">
                  ${s.valueDeck.map((id) => html`
                    <button
                      class=${this.onBlockValueId === id ? 'onblock' : ''}
                      ?disabled=${!!s.currentAuction && !s.currentAuction.lockedIn}
                      @click=${() => this.startAuction(id)}
                    >
                      ${getValue(id)?.name}
                    </button>
                  `)}
                </div>
              `
            : html`<p style="opacity:0.7">auction starts in act 4.</p>`}
        </aside>
      </div>

      ${this.showJumpConfirm
        ? html`
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="jmp-title">
              <div class="box">
                <h2 id="jmp-title">you\u2019re about to jump acts</h2>
                <p>this is irreversible for the session feel. continue?</p>
                <div style="display: flex; gap: var(--space-2); margin-top: var(--space-4); justify-content: flex-end">
                  <va-button variant="ghost" @click=${() => (this.showJumpConfirm = null)}>cancel</va-button>
                  <va-button variant="primary" @click=${() => this.confirmJump()}>continue</va-button>
                </div>
              </div>
            </div>
          `
        : null}
    `;
  }

  private renderStage() {
    const s = this.state;
    if (s.currentAct === 'arrival') {
      return html`<p>${s.participants.length} people joined. press <strong>next act</strong> when ready.</p>`;
    }
    if (s.currentAct === 'grouping') {
      return html`
        <p>${s.participants.filter((p) => p.archetype).length} of ${s.participants.length} picked an archetype.</p>
      `;
    }
    if (s.currentAct === 'strategy') {
      const totals = s.teams.map((t) => ({
        name: t.name,
        must: Object.values(t.intentions).filter((z) => z === 'must').length,
      }));
      return html`
        <ul>
          ${totals.map((t) => html`<li>${t.name}: ${t.must} \u2018must have\u2019 values</li>`)}
        </ul>
      `;
    }
    if (s.currentAct === 'auction') {
      const a = s.currentAuction;
      if (!a) return html`<p>no card on the block.</p>`;
      return html`
        <div>
          <strong>${getValue(a.valueId)?.name}</strong>
          <p>${getValue(a.valueId)?.description}</p>
          <p>high: <strong>${a.highBid ? `${a.highBid.amount} credos (${s.teams.find((t) => t.id === a.highBid!.teamId)?.name})` : 'no bids yet'}</strong></p>
        </div>
      `;
    }
    if (s.currentAct === 'reflection') {
      return html`
        <ul>
          ${s.teams.map((t) => html`<li>${t.name}: ${t.purposeStatement ? 'wrote purpose' : 'still drafting'}</li>`)}
        </ul>
      `;
    }
    if (s.currentAct === 'regather') {
      return html`<p>let every team share one line from their identity card.</p>`;
    }
    return null;
  }
}
