import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Controller } from '@/state/controller';
import type { Session } from '@/state/types';
import { COPY } from '@/content/copy';
import { ACTS } from '@/content/acts';
import { VALUES } from '@/content/values';
import { DEFAULT_AUCTION_MS, advanceAct, assignTeams } from '@/state/reducers';
import { bidsPerMinute, silentTeams } from '@/state/selectors';
import { startTicker } from '@/utils/timer';
import '@/components/va-card';
import '@/components/va-button';
import '@/components/credos-stack';
import '@/components/countdown';
import '@/components/act-timeline';
import '@/components/value-card';
import '@/components/onboarding-flow';

@customElement('va-facilitator')
export class VaFacilitator extends LitElement {
  @property({ attribute: false }) controller?: Controller;
  @property({ type: String }) code = 'DEMO';

  @state() private session?: Session;
  @state() private broadcastDraft = '';
  @state() private nextValueId: string | null = null;
  @state() private tickNow = Date.now();
  @state() private pendingJump: string | null = null;
  @state() private onboarded = false;

  private unsub?: () => void;
  private ticker: { stop(): void } | null = null;

  private completeOnboarding = () => {
    localStorage.setItem('va:onboarded:facilitator', '1');
    this.onboarded = true;
  };

  connectedCallback() {
    super.connectedCallback();
    this.onboarded = localStorage.getItem('va:onboarded:facilitator') === '1';
    if (this.controller) {
      this.unsub = this.controller.store.subscribe((s) => (this.session = s));
      this.session = this.controller.store.getState();
      if (this.session.currentAct === 'arrival' && !this.session.startedAt) {
        this.controller.dispatch({
          type: 'SESSION_INIT',
          sessionId: this.code,
          facilitatorId: 'facilitator-local',
        });
      }
    }
    this.ticker = startTicker((n) => (this.tickNow = n), 500);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
    this.ticker?.stop();
  }

  private startSession() {
    this.controller?.dispatch({ type: 'SESSION_START' });
  }

  private advance() {
    if (!this.session) return;
    const act = advanceAct(this.session);
    if (act) {
      // on entering scene or strategy, make sure teams are formed
      if (
        (act.type === 'ACT_ADVANCE' && act.to === 'scene' && this.session.teams.length === 0) ||
        (act.type === 'ACT_ADVANCE' && act.to === 'scene')
      ) {
        if (this.session.teams.length === 0) this.formTeams();
      }
      this.controller?.dispatch(act);
    }
  }

  private extend() {
    this.controller?.dispatch({ type: 'ACT_EXTEND', addMs: 30_000 });
  }

  private formTeams() {
    if (!this.session) return;
    const { teams, assignments } = assignTeams(
      this.session.participants.filter((p) => p.role === 'participant'),
    );
    this.controller?.dispatch({ type: 'TEAMS_FORM', teams, assignments });
  }

  private confirmJump(to: string) {
    if (!this.pendingJump) {
      this.pendingJump = to;
      return;
    }
    if (this.pendingJump !== to) {
      this.pendingJump = to;
      return;
    }
    this.controller?.dispatch({ type: 'ACT_ADVANCE', to: to as any, at: Date.now() });
    this.pendingJump = null;
  }

  private startAuction() {
    if (!this.nextValueId) return;
    this.controller?.dispatch({
      type: 'AUCTION_START',
      valueId: this.nextValueId,
      durationMs: DEFAULT_AUCTION_MS,
      at: Date.now(),
    });
  }

  private endAuction() {
    this.controller?.dispatch({ type: 'AUCTION_END', at: Date.now() });
    this.nextValueId = null;
  }

  private broadcast() {
    if (!this.broadcastDraft.trim()) return;
    this.controller?.dispatch({
      type: 'BROADCAST',
      message: this.broadcastDraft.trim(),
      at: Date.now(),
    });
    this.broadcastDraft = '';
  }

  private resetBid() {
    this.controller?.dispatch({ type: 'RESET_CURRENT_BID', at: Date.now() });
  }

  private muteTeam(teamId: string, muted: boolean) {
    this.controller?.dispatch({ type: 'MUTE_TEAM', teamId, muted });
  }

  static styles = css`
    :host {
      display: grid;
      grid-template-columns: 280px 1fr 340px;
      gap: var(--space-5);
      padding: var(--space-5);
      min-height: 100vh;
      align-items: start;
    }
    @media (max-width: 1100px) {
      :host {
        grid-template-columns: 1fr;
      }
    }
    header {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }
    .wordmark {
      height: 32px;
    }
    .code {
      font: var(--type-mono);
    }
    .panel {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-card);
    }
    .panel h2 {
      font: var(--type-h2);
      margin-bottom: var(--space-3);
    }
    .signal dl {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: var(--space-2) var(--space-4);
    }
    .signal dt {
      color: var(--fg-muted);
      font-size: 14px;
    }
    .signal dd {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .team-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .team-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) var(--space-3);
      background: var(--bg);
      border-radius: var(--radius-sm);
    }
    .team-row .colour {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: var(--space-2);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
    .deck {
      max-height: 360px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .deck button {
      text-align: left;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
      border: 2px solid transparent;
      background: var(--bg);
      font-weight: 700;
    }
    .deck button[data-selected='true'] {
      border-color: var(--wv-redwood);
    }
    .deck button:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
    input[type='text'] {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg-card);
      width: 100%;
      margin-bottom: var(--space-2);
    }
    .tools {
      margin-top: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .jump-confirm {
      background: var(--wv-redwood);
      color: var(--fg-inverse);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      margin-top: var(--space-3);
      font-size: 14px;
    }
    .jump-confirm va-button {
      margin-top: var(--space-2);
    }
  `;

  render() {
    if (!this.session) return html`<p>connecting…</p>`;
    if (!this.onboarded) {
      const c = COPY.onboarding.facilitator;
      return html`
        <va-onboarding
          .title=${c.title}
          .steps=${c.steps as any}
          .enterLabel=${c.enter}
          .skipLabel=${c.skip}
          @va-onboarding-done=${() => this.completeOnboarding()}
          @va-onboarding-skip=${() => this.completeOnboarding()}
        ></va-onboarding>
      `;
    }
    const s = this.session;
    const currentActDef = ACTS.find((a) => a.id === s.currentAct);
    const participants = s.participants.filter((p) => p.role === 'participant');
    const bpm = bidsPerMinute(s, 60_000, this.tickNow);
    const silent = silentTeams(s, 60_000, this.tickNow);

    const availableValues = VALUES.filter((v) => s.valueDeck.includes(v.id));

    return html`
      <header>
        <img class="wordmark" src="/wordmark.svg" alt="winded.vertigo" />
        <span class="code">session ${this.code}</span>
      </header>

      <!-- left pane: timeline + act controls -->
      <aside class="panel">
        <h2>act timeline</h2>
        <va-act-timeline
          interactive
          .currentAct=${s.currentAct}
          @va-jump=${(e: CustomEvent<{ to: string }>) => this.confirmJump(e.detail.to)}
        ></va-act-timeline>
        ${this.pendingJump && this.pendingJump !== s.currentAct
          ? html`
              <div class="jump-confirm" role="alertdialog">
                ${COPY.facilitator.jumpConfirm}
                <div>
                  <va-button
                    variant="urgent"
                    size="sm"
                    @va-click=${() => this.confirmJump(this.pendingJump!)}
                    >${COPY.facilitator.continue}</va-button
                  >
                  <va-button
                    variant="ghost"
                    size="sm"
                    @va-click=${() => (this.pendingJump = null)}
                    >${COPY.facilitator.cancel}</va-button
                  >
                </div>
              </div>
            `
          : ''}
        <div class="actions">
          ${!s.startedAt
            ? html`<va-button variant="primary" @va-click=${() => this.startSession()}
                >${COPY.facilitator.startSession}</va-button
              >`
            : html`
                <va-button variant="primary" @va-click=${() => this.advance()}
                  >${COPY.facilitator.nextAct}</va-button
                >
                <va-button variant="ghost" @va-click=${() => this.extend()}
                  >${COPY.facilitator.extend}</va-button
                >
              `}
        </div>
        ${s.actStartedAt
          ? html`<div style="margin-top: var(--space-3)">
              <va-countdown
                .startedAt=${s.actStartedAt}
                .durationMs=${s.actDurationMs}
              ></va-countdown>
              <span style="margin-left: var(--space-2); color: var(--fg-muted);"
                >${currentActDef?.name}</span
              >
            </div>`
          : ''}
      </aside>

      <!-- centre: live signal + broadcast -->
      <section>
        <div class="panel signal">
          <h2>${COPY.facilitator.liveSignal}</h2>
          <dl>
            <dt>participants</dt>
            <dd>${participants.length}</dd>
            <dt>teams formed</dt>
            <dd>${s.teams.length}</dd>
            <dt>bids / min</dt>
            <dd>${bpm}</dd>
            <dt>values remaining</dt>
            <dd>${s.valueDeck.length}</dd>
            <dt>auctions complete</dt>
            <dd>${s.completedAuctions.length}</dd>
          </dl>
        </div>

        <div class="panel" style="margin-top: var(--space-4);">
          <h2>teams</h2>
          <div class="team-list">
            ${s.teams.map(
              (t) => html`
                <div class="team-row">
                  <span>
                    <span class="colour" style=${`background: var(--team-${t.colour})`}></span>
                    ${t.name}
                  </span>
                  <span>${t.credos} credos</span>
                  <va-button
                    size="sm"
                    variant="ghost"
                    @va-click=${() =>
                      this.muteTeam(t.id, !s.mutedTeamIds.includes(t.id))}
                    >${s.mutedTeamIds.includes(t.id) ? 'unmute' : 'mute'}</va-button
                  >
                </div>
              `,
            )}
          </div>
          ${silent.length > 0 && s.currentAct === 'auction'
            ? html`<p style="margin-top: var(--space-3); color: var(--wv-redwood)">
                quiet: ${silent.map((t) => t.name).join(', ')}
              </p>`
            : ''}
        </div>

        <div class="panel" style="margin-top: var(--space-4);">
          <h2>broadcast</h2>
          <label for="bc-input" class="sr-only">${COPY.facilitator.broadcastLabel}</label>
          <input
            id="bc-input"
            type="text"
            .value=${this.broadcastDraft}
            @input=${(e: Event) =>
              (this.broadcastDraft = (e.target as HTMLInputElement).value)}
            placeholder="one sentence to all participants..."
          />
          <va-button variant="primary" @va-click=${() => this.broadcast()}>
            ${COPY.facilitator.broadcastSend}
          </va-button>
        </div>
      </section>

      <!-- right: deck + auction control + tools -->
      <aside class="panel">
        <h2>${COPY.facilitator.deckLabel}</h2>
        <div class="deck">
          ${availableValues.map(
            (v) => html`
              <button
                type="button"
                data-selected=${this.nextValueId === v.id}
                @click=${() => (this.nextValueId = v.id)}
              >
                ${v.name}
              </button>
            `,
          )}
          ${availableValues.length === 0
            ? html`<p style="color: var(--fg-muted)">deck empty.</p>`
            : ''}
        </div>
        <div class="actions">
          ${!s.currentAuction
            ? html`<va-button
                variant="urgent"
                ?disabled=${!this.nextValueId || s.currentAct !== 'auction'}
                @va-click=${() => this.startAuction()}
              >
                ${COPY.facilitator.startAuction}
              </va-button>`
            : html`<va-button variant="ghost" @va-click=${() => this.endAuction()}
                >end auction</va-button
              >`}
        </div>

        <div class="tools">
          <h2>${COPY.facilitator.tools}</h2>
          <va-button
            size="sm"
            variant="ghost"
            ?disabled=${!s.currentAuction}
            @va-click=${() => this.resetBid()}
            >${COPY.facilitator.resetBid}</va-button
          >
        </div>
      </aside>
    `;
  }
}
