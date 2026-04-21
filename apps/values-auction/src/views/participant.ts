import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Controller } from '@/state/controller';
import type { Session, Team } from '@/state/types';
import { COPY } from '@/content/copy';
import { teamForParticipant } from '@/state/selectors';
import { uid } from '@/utils/id';
import { announce } from '@/utils/a11y';
import '@/components/va-card';
import '@/components/va-button';
import '@/components/credos-stack';
import '@/components/countdown';
import '@/components/company-card';
import '@/components/strategy-board';
import '@/components/value-card';
import '@/components/bid-button';
import '@/components/identity-card';
import '@/components/onboarding-flow';
import { getValue } from '@/content/values';
import { asset } from '@/utils/asset';

@customElement('va-participant')
export class VaParticipant extends LitElement {
  @property({ attribute: false }) controller?: Controller;
  @property({ type: String }) code = 'DEMO';

  @state() private session?: Session;
  @state() private participantId = '';
  @state() private name = '';
  @state() private joined = false;
  @state() private currentPrompt = 0;
  @state() private onboarded = false;
  private unsub?: () => void;
  private lastBidSeen = 0;

  connectedCallback() {
    super.connectedCallback();
    this.participantId = this.restoreOrCreateId();
    this.onboarded = localStorage.getItem('va:onboarded:participant') === '1';
    this.unsub = this.controller?.store.subscribe((s) => {
      this.session = s;
      this.reactToSession(s);
    });
    this.session = this.controller?.store.getState();
    const cachedName = localStorage.getItem(`va:name:${this.code}`);
    if (cachedName) {
      this.name = cachedName;
      this.joined = this.session?.participants.some((p) => p.id === this.participantId) ?? false;
    }
  }

  private completeOnboarding = () => {
    localStorage.setItem('va:onboarded:participant', '1');
    this.onboarded = true;
  };

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsub?.();
  }

  private restoreOrCreateId(): string {
    const key = `va:pid:${this.code}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = uid('p');
    localStorage.setItem(key, id);
    return id;
  }

  private reactToSession(s: Session) {
    const auction = s.currentAuction;
    if (auction?.highBid && auction.highBid.at > this.lastBidSeen) {
      this.lastBidSeen = auction.highBid.at;
      const team = s.teams.find((t) => t.id === auction.highBid?.teamId);
      if (team) announce(`high bid: ${auction.highBid.amount} credos, ${team.name}.`, 'assertive');
    }
  }

  private get team(): Team | undefined {
    if (!this.session) return undefined;
    return teamForParticipant(this.session, this.participantId);
  }

  private handleJoin(e: Event) {
    e.preventDefault();
    if (!this.name.trim() || !this.controller) return;
    localStorage.setItem(`va:name:${this.code}`, this.name.trim());
    this.controller.dispatch({
      type: 'PARTICIPANT_JOIN',
      participant: {
        id: this.participantId,
        displayName: this.name.trim(),
        teamId: null,
        joinedAt: Date.now(),
        lastSeenAt: Date.now(),
        role: 'participant',
      },
    });
    this.joined = true;
  }

  private selectArchetype(archetype: 'builder' | 'diplomat' | 'rebel' | 'steward') {
    this.controller?.dispatch({
      type: 'ARCHETYPE_SELECT',
      participantId: this.participantId,
      archetype,
    });
  }

  private markReady() {
    // no-op for mvp; facilitator drives the clock.
  }

  private onBid(e: CustomEvent<{ amount: number }>) {
    if (!this.team) return;
    this.controller?.dispatch({
      type: 'BID_PLACE',
      teamId: this.team.id,
      amount: e.detail.amount,
      at: Date.now(),
    });
  }

  private onIntention = (e: CustomEvent) => {
    const detail = e.detail as { teamId: string; valueId: string; zone: any };
    this.controller?.dispatch({ type: 'INTENTION_SET', ...detail });
  };

  private onCeiling = (e: CustomEvent) => {
    const detail = e.detail as { teamId: string; valueId: string; amount: number };
    this.controller?.dispatch({ type: 'CEILING_SET', ...detail });
  };

  private writePurpose(e: Event) {
    const val = (e.target as HTMLTextAreaElement).value;
    if (!this.team) return;
    this.controller?.dispatch({
      type: 'PURPOSE_WRITE',
      teamId: this.team.id,
      statement: val,
    });
  }

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      padding: var(--space-5);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }
    .wordmark {
      height: 32px;
    }
    .code {
      font: var(--type-mono);
      color: var(--fg-muted);
    }
    .stage {
      max-width: 880px;
      margin: 0 auto;
    }
    .arrival {
      text-align: center;
      padding-top: var(--space-7);
    }
    .arrival h1 {
      font: var(--type-display);
      margin-bottom: var(--space-3);
    }
    .arrival p {
      margin: 0 auto var(--space-5);
      color: var(--fg-muted);
    }
    form.join {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      align-items: center;
    }
    form.join input {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-pill);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg-card);
      font: var(--type-body);
      min-width: 280px;
    }
    .waiting {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
      margin-top: var(--space-5);
    }
    .waiting .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--wv-cadet-blue);
      animation: va-breathe 2s var(--ease-in-out) infinite;
    }
    .waiting .dot:nth-child(2) {
      animation-delay: 0.4s;
    }
    .waiting .dot:nth-child(3) {
      animation-delay: 0.8s;
    }
    .archetypes {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: 1fr;
    }
    @media (min-width: 720px) {
      .archetypes {
        grid-template-columns: 1fr 1fr;
      }
    }
    .archetype {
      padding: var(--space-5);
      cursor: pointer;
      border: 2px solid transparent;
      transition: all var(--dur-base) var(--ease-out-quart);
    }
    .archetype:focus-visible,
    .archetype:hover {
      border-color: var(--wv-cadet-blue);
      transform: translateY(-2px);
    }
    .archetype[data-active] {
      border-color: var(--wv-redwood);
      animation: va-spring-pulse var(--dur-base) var(--ease-spring);
    }
    .archetype h3 {
      font: var(--type-h2);
      margin-bottom: var(--space-2);
    }
    .auction-stage {
      text-align: center;
      padding: var(--space-5);
    }
    .auction-stage .high {
      margin-top: var(--space-4);
      font-weight: 700;
      font-size: 18px;
    }
    .auction-stage .high .colour-chip {
      display: inline-block;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-right: var(--space-2);
      vertical-align: middle;
    }
    .reflection {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .reflection textarea {
      width: 100%;
      min-height: 120px;
      border-radius: var(--radius-md);
      border: 2px solid var(--wv-cadet-blue);
      padding: var(--space-3);
      font: var(--type-body);
      resize: vertical;
    }
    .sector {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid rgba(39, 50, 72, 0.15);
    }
    va-countdown {
      display: inline-block;
    }
  `;

  private renderArrival() {
    if (!this.joined) {
      return html`
        <section class="arrival fade-in">
          <h1>${COPY.arrival.heading}</h1>
          <p>${COPY.arrival.subheading}</p>
          <form class="join" @submit=${(e: Event) => this.handleJoin(e)}>
            <label for="name" class="sr-only">${COPY.arrival.nameLabel}</label>
            <input
              id="name"
              type="text"
              .value=${this.name}
              @input=${(e: Event) =>
                (this.name = (e.target as HTMLInputElement).value)}
              placeholder=${COPY.arrival.nameLabel}
              required
              autocomplete="name"
            />
            <va-button variant="primary" size="lg" @va-click=${(e: Event) => this.handleJoin(e)}>
              ${COPY.arrival.joinButton}
            </va-button>
          </form>
        </section>
      `;
    }
    return html`
      <section class="arrival fade-in">
        <h1>you’re in, ${this.name}.</h1>
        <p>${COPY.arrival.waitingForFacilitator}</p>
        <div class="waiting" aria-hidden="true">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </section>
    `;
  }

  private renderGrouping() {
    const me = this.session?.participants.find((p) => p.id === this.participantId);
    return html`
      <section class="fade-in">
        <h1>${COPY.grouping.heading}</h1>
        <div class="archetypes" role="radiogroup" aria-label="archetype choice">
          ${COPY.grouping.options.map(
            (opt) => html`
              <va-card
                interactive
                class="archetype"
                role="radio"
                tabindex="0"
                aria-checked=${me?.archetype === opt.key}
                data-active=${me?.archetype === opt.key ? true : null}
                @click=${() => this.selectArchetype(opt.key)}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectArchetype(opt.key);
                  }
                }}
              >
                <h3>${opt.key}</h3>
                <p>${opt.label}</p>
              </va-card>
            `,
          )}
        </div>
        ${this.team
          ? html`<p class="sector">${COPY.grouping.assigned(this.team.colour, 4)}</p>`
          : ''}
      </section>
    `;
  }

  private renderScene() {
    if (!this.team) return html`<p>waiting for a team assignment…</p>`;
    return html`
      <section class="fade-in">
        ${this.renderCountdown()}
        <va-company-card .team=${this.team}></va-company-card>
        <div class="sector">
          <va-button variant="primary" @va-click=${() => this.markReady()}>
            ${COPY.scene.ready}
          </va-button>
        </div>
      </section>
    `;
  }

  private renderStrategy() {
    if (!this.team) return html`<p>finding your team…</p>`;
    return html`
      <section class="fade-in">
        ${this.renderCountdown()}
        <va-strategy-board
          .team=${this.team}
          @va-intention=${this.onIntention}
          @va-ceiling=${this.onCeiling}
        ></va-strategy-board>
      </section>
    `;
  }

  private renderAuction() {
    const auction = this.session?.currentAuction;
    if (!auction) {
      return html`
        <section class="auction-stage fade-in">
          <h2>${COPY.auction.restrategise}</h2>
          <p>${COPY.auction.refundNeverHappens}</p>
        </section>
      `;
    }
    const v = getValue(auction.valueId);
    const highTeam = this.session?.teams.find((t) => t.id === auction.highBid?.teamId);
    return html`
      <section class="auction-stage fade-in">
        <va-value-card .value=${v} zone="must" large></va-value-card>
        <div style="margin-top: var(--space-4)">
          <va-countdown
            ring
            .startedAt=${auction.startedAt}
            .durationMs=${auction.durationMs}
            announceSeconds
          ></va-countdown>
        </div>
        <div class="high" aria-live="polite">
          ${auction.highBid && highTeam
            ? html`<span
                  class="colour-chip"
                  style=${`background: var(--team-${highTeam.colour})`}
                ></span
                >${highTeam.name}: ${auction.highBid.amount} credos`
            : COPY.auction.noBidsYet}
        </div>
        ${this.team
          ? html`<div style="margin-top: var(--space-5)">
              <va-bid-button
                .currentHigh=${auction.highBid?.amount ?? 0}
                .credos=${this.team.credos}
                @va-bid=${(e: CustomEvent<{ amount: number }>) => this.onBid(e)}
              ></va-bid-button>
            </div>`
          : ''}
      </section>
    `;
  }

  private renderReflection() {
    if (!this.team) return html``;
    const prompts = COPY.reflection.prompts;
    const current = prompts[this.currentPrompt];
    const isLast = this.currentPrompt >= prompts.length - 1;
    return html`
      <section class="reflection fade-in">
        <va-company-card .team=${this.team} showWon></va-company-card>
        <div class="sector">
          <h2>${current}</h2>
          ${isLast
            ? html`
                <label for="purpose">${COPY.reflection.purpose}</label>
                <textarea
                  id="purpose"
                  placeholder=${COPY.reflection.placeholder}
                  .value=${this.team.purposeStatement ?? ''}
                  @input=${(e: Event) => this.writePurpose(e)}
                ></textarea>
                <va-button
                  variant="primary"
                  @va-click=${() =>
                    announce(COPY.reflection.ready, 'polite')}
                  >${COPY.reflection.submit}</va-button
                >
              `
            : html`
                <va-button
                  variant="primary"
                  @va-click=${() => (this.currentPrompt += 1)}
                >
                  ${COPY.reflection.next}
                </va-button>
              `}
        </div>
      </section>
    `;
  }

  private renderRegather() {
    if (!this.team) return html``;
    return html`
      <section class="fade-in">
        <va-identity-card .team=${this.team}></va-identity-card>
        <div class="sector">
          <va-button
            variant="primary"
            @va-click=${() =>
              this.dispatchEvent(
                new CustomEvent('va-download-card', {
                  detail: { teamId: this.team?.id },
                  bubbles: true,
                  composed: true,
                }),
              )}
            >${COPY.regather.download}</va-button
          >
          <p style="margin-top: var(--space-4); color: var(--fg-muted);">
            ${COPY.regather.qr}
          </p>
        </div>
      </section>
    `;
  }

  private renderCountdown() {
    if (!this.session?.actStartedAt) return html``;
    return html`
      <div style="display: flex; justify-content: flex-end; margin-bottom: var(--space-3);">
        <va-countdown
          .startedAt=${this.session.actStartedAt}
          .durationMs=${this.session.actDurationMs}
        ></va-countdown>
      </div>
    `;
  }

  render() {
    if (!this.session) return html`<p>loading…</p>`;
    if (!this.onboarded) {
      const c = COPY.onboarding.participant;
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
    const act = this.session.currentAct;
    let body;
    if (act === 'arrival') body = this.renderArrival();
    else if (act === 'grouping') body = this.renderGrouping();
    else if (act === 'scene') body = this.renderScene();
    else if (act === 'strategy') body = this.renderStrategy();
    else if (act === 'auction') body = this.renderAuction();
    else if (act === 'reflection') body = this.renderReflection();
    else body = this.renderRegather();

    return html`
      <header>
        <img class="wordmark" src=${asset('wordmark.svg')} alt="winded.vertigo" />
        <span class="code">${COPY.arrival.codeLabel}: ${this.code}</span>
      </header>
      <div class="stage">${body}</div>
    `;
  }
}
