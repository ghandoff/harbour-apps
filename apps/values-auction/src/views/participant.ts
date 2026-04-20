import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Session, Action } from '../state/types.js';
import { COPY } from '../content/copy.js';
import { getStartup } from '../content/startups.js';
import { getValue } from '../content/values.js';
import { shortId } from '../utils/id.js';
import { teamOfParticipant } from '../state/selectors.js';
import { announce } from '../utils/a11y.js';
import { wordmark } from '../components/icons.js';

@customElement('va-participant')
export class VaParticipant extends LitElement {
  @property({ attribute: false }) state!: Session;
  @property({ type: String }) sessionCode = '';

  @state() private participantId = '';
  @state() private displayName = '';
  @state() private nameInput = '';
  @state() private archetype: 'builder' | 'diplomat' | 'rebel' | 'steward' | '' = '';
  @state() private reflectionIndex = 0;
  @state() private purposeDraft = '';

  static override styles = css`
    :host {
      display: block;
      min-height: 100dvh;
      background: var(--bg);
      color: var(--fg);
    }
    .page {
      max-width: 960px;
      margin: 0 auto;
      padding: var(--space-5) var(--space-4);
      position: relative;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
    }
    .heading { font: var(--type-h1); margin-bottom: var(--space-4); }
    .sub { font-size: 18px; opacity: 0.8; margin-bottom: var(--space-5); }
    form { display: flex; flex-direction: column; gap: var(--space-4); max-width: 420px; }
    input[type='text'] {
      padding: var(--space-3);
      font: var(--type-h2);
      border: 2px solid var(--wv-cadet-blue);
      border-radius: var(--radius-sm);
      background: var(--bg-card);
    }
    .dots { display: inline-flex; gap: var(--space-2); }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: var(--wv-cadet-blue); opacity: 0.6;
      animation: breathe 2s var(--ease-in-out) infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.3s; }
    .dot:nth-child(3) { animation-delay: 0.6s; }
    @keyframes breathe { 50% { opacity: 1; transform: scale(1.2); } }

    .tiles {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }
    @media (min-width: 640px) { .tiles { grid-template-columns: repeat(2, 1fr); } }
    .tile {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      text-align: left;
      font: var(--type-body);
      cursor: pointer;
      border: 2px solid transparent;
      transition: transform var(--dur-base) var(--ease-spring), border-color var(--dur-base);
    }
    .tile:hover, .tile.selected {
      transform: translateY(-2px);
      border-color: var(--wv-cadet-blue);
    }
    .tile.selected { border-color: var(--accent-urgent); }
    .tile strong { display: block; font-size: 18px; margin-bottom: var(--space-1); }

    .auction-stage {
      display: grid;
      place-items: center;
      padding: var(--space-6) 0;
      gap: var(--space-5);
    }
    .high-bid {
      display: inline-flex; gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
    }
    .dim { opacity: 0.2; pointer-events: none; }

    .reflection-prompt {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      max-width: 640px;
    }
    textarea {
      width: 100%;
      min-height: 120px;
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--wv-white);
      resize: vertical;
      font: var(--type-body);
      margin-top: var(--space-3);
    }
    .toast {
      position: fixed;
      bottom: var(--space-5);
      left: 50%;
      transform: translateX(-50%);
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-pill);
      box-shadow: var(--shadow-card-lifted);
      z-index: 10;
    }
  `;

  private dispatchAction(action: Action) {
    this.dispatchEvent(new CustomEvent('va-action', { detail: action, bubbles: true, composed: true }));
  }

  private handleJoin(e: Event) {
    e.preventDefault();
    const name = this.nameInput.trim();
    if (!name) return;
    this.displayName = name;
    this.participantId = shortId();
    this.dispatchAction({ type: 'joinParticipant', participantId: this.participantId, displayName: name, at: Date.now() });
  }

  private pickArchetype(k: 'builder' | 'diplomat' | 'rebel' | 'steward') {
    this.archetype = k;
    this.dispatchAction({ type: 'chooseArchetype', participantId: this.participantId, archetype: k, at: Date.now() });
  }

  private renderArrival() {
    if (this.participantId) {
      return html`
        <div>
          <h1 class="heading">hi ${this.displayName}.</h1>
          <p class="sub">${COPY.arrival.waitingForFacilitator}</p>
          <div class="dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      `;
    }
    return html`
      <h1 class="heading">${COPY.arrival.heading}</h1>
      <p class="sub">${COPY.arrival.subheading}</p>
      <form @submit=${this.handleJoin}>
        <label>
          <span class="sr-only">${COPY.arrival.nameLabel}</span>
          <input
            type="text"
            aria-label=${COPY.arrival.nameLabel}
            placeholder=${COPY.arrival.nameLabel}
            .value=${this.nameInput}
            @input=${(e: Event) => (this.nameInput = (e.target as HTMLInputElement).value)}
            autocomplete="off"
            required
          />
        </label>
        <va-button variant="primary" type="submit" @click=${this.handleJoin}>${COPY.arrival.joinButton}</va-button>
      </form>
    `;
  }

  private renderGrouping() {
    const team = teamOfParticipant(this.state, this.participantId);
    if (team) {
      return html`
        <h1 class="heading">you\u2019re with ${team.name}.</h1>
        <p class="sub">the others are finding their seats.</p>
      `;
    }
    return html`
      <h1 class="heading">${COPY.grouping.heading}</h1>
      <div class="tiles" role="radiogroup" aria-label="strategy archetype">
        ${COPY.grouping.options.map((o) => html`
          <button
            class="tile ${this.archetype === o.key ? 'selected' : ''}"
            role="radio"
            aria-checked=${this.archetype === o.key}
            @click=${() => this.pickArchetype(o.key as any)}
          >
            <strong>${o.label.split(' \u2014 ')[0]}</strong>
            <span>${o.label.split(' \u2014 ')[1] ?? ''}</span>
          </button>
        `)}
      </div>
    `;
  }

  private renderScene() {
    const team = teamOfParticipant(this.state, this.participantId);
    if (!team) return this.renderWaiting();
    const startup = getStartup(team.startupId);
    if (!startup) return this.renderWaiting();
    return html`
      <va-company-card
        .startupId=${startup.id}
        .wonValues=${team.wonValues}
        .teamName=${team.name}
      ></va-company-card>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:var(--space-5);">
        <va-credos-stack .credos=${team.credos}></va-credos-stack>
        <va-button variant="primary" @click=${() => {/* facilitator drives timing; ready is a local cue */}}>${COPY.scene.ready}</va-button>
      </div>
    `;
  }

  private renderStrategy() {
    const team = teamOfParticipant(this.state, this.participantId);
    if (!team) return this.renderWaiting();
    return html`
      <va-strategy-board
        .intentions=${team.intentions}
        .softCeilings=${team.softCeilings}
        .credos=${team.credos}
        @intention=${(e: CustomEvent) => this.dispatchAction({
          type: 'setIntention',
          teamId: team.id,
          valueId: e.detail.valueId,
          zone: e.detail.zone,
          at: Date.now(),
        })}
        @ceiling=${(e: CustomEvent) => this.dispatchAction({
          type: 'setSoftCeiling',
          teamId: team.id,
          valueId: e.detail.valueId,
          amount: e.detail.amount,
          at: Date.now(),
        })}
      ></va-strategy-board>
    `;
  }

  private renderAuction() {
    const team = teamOfParticipant(this.state, this.participantId);
    const a = this.state.currentAuction;
    if (!a) {
      return html`
        <h1 class="heading">${COPY.auction.restrategise}</h1>
        <p class="sub">${COPY.auction.refundNeverHappens}</p>
        ${team ? html`<va-credos-stack .credos=${team.credos}></va-credos-stack>` : null}
      `;
    }
    const value = getValue(a.valueId);
    const highBidTeam = a.highBid ? this.state.teams.find((t) => t.id === a.highBid!.teamId) : null;
    return html`
      <div class="auction-stage">
        <p aria-live="polite" style="opacity:0.7">${COPY.auction.live}</p>
        <va-value-card big .valueId=${a.valueId}></va-value-card>
        <va-countdown ring .startedAt=${a.startedAt} .durationMs=${a.durationMs}></va-countdown>
        <div class="high-bid" aria-live="assertive">
          ${a.highBid
            ? html`<strong>${a.highBid.amount}</strong> credos &middot; ${highBidTeam?.name ?? 'a team'}`
            : html`<span>no bids yet.</span>`}
        </div>
        ${team
          ? html`
              <div style="display:flex; align-items:center; gap: var(--space-4)">
                <va-credos-stack .credos=${team.credos}></va-credos-stack>
                <va-bid-button
                  .currentHigh=${a.highBid?.amount ?? 0}
                  .credosRemaining=${team.credos}
                  ?disabled=${team.credos <= (a.highBid?.amount ?? 0)}
                  @place-bid=${(e: CustomEvent) => this.dispatchAction({
                    type: 'placeBid',
                    teamId: team.id,
                    amount: e.detail.amount,
                    at: Date.now(),
                  })}
                ></va-bid-button>
              </div>
            `
          : null}
        <small aria-hidden="true">${value?.description}</small>
      </div>
    `;
  }

  private renderReflection() {
    const team = teamOfParticipant(this.state, this.participantId);
    if (!team) return this.renderWaiting();
    const prompts = COPY.reflection.prompts;
    const idx = Math.min(this.reflectionIndex, prompts.length);
    return html`
      <va-company-card
        .startupId=${team.startupId}
        .wonValues=${team.wonValues}
        .purposeStatement=${team.purposeStatement ?? ''}
        .teamName=${team.name}
      ></va-company-card>
      ${idx < prompts.length
        ? html`
            <div class="reflection-prompt" style="margin-top:var(--space-5)">
              <p><strong>${prompts[idx]}</strong></p>
              <va-button
                variant="primary"
                @click=${() => (this.reflectionIndex = idx + 1)}
                style="margin-top: var(--space-4)"
              >next</va-button>
            </div>
          `
        : html`
            <div class="reflection-prompt" style="margin-top:var(--space-5)">
              <label for="purpose"><strong>${COPY.reflection.purpose}</strong></label>
              <textarea
                id="purpose"
                placeholder=${COPY.reflection.placeholder}
                .value=${team.purposeStatement ?? this.purposeDraft}
                @input=${(e: Event) => {
                  const v = (e.target as HTMLTextAreaElement).value;
                  this.purposeDraft = v;
                  this.dispatchAction({ type: 'writePurpose', teamId: team.id, statement: v, at: Date.now() });
                }}
              ></textarea>
            </div>
          `}
    `;
  }

  private renderRegather() {
    const team = teamOfParticipant(this.state, this.participantId);
    if (!team) return this.renderWaiting();
    return html`
      <h1 class="heading">${COPY.regather.cta}</h1>
      <va-identity-card
        .startupId=${team.startupId}
        .teamName=${team.name}
        .wonValues=${team.wonValues}
        .purposeStatement=${team.purposeStatement ?? ''}
        .sessionCode=${this.sessionCode}
      ></va-identity-card>
      <p style="margin-top: var(--space-5); opacity:0.7">${COPY.regather.qr}</p>
    `;
  }

  private renderWaiting() {
    return html`<p class="sub">${COPY.arrival.waitingForFacilitator}</p>`;
  }

  override updated(changed: Map<string, unknown>) {
    super.updated(changed);
    if (changed.has('state') && this.state?.broadcast) {
      const prev = changed.get('state') as Session | undefined;
      if (!prev || prev.broadcast?.at !== this.state.broadcast.at) {
        announce(this.state.broadcast.message, 'polite');
      }
    }
  }

  override render() {
    if (!this.state) return html`<p>loading...</p>`;
    let body;
    switch (this.state.currentAct) {
      case 'arrival': body = this.renderArrival(); break;
      case 'grouping': body = this.renderGrouping(); break;
      case 'scene': body = this.renderScene(); break;
      case 'strategy': body = this.renderStrategy(); break;
      case 'auction': body = this.renderAuction(); break;
      case 'reflection': body = this.renderReflection(); break;
      case 'regather': body = this.renderRegather(); break;
    }
    return html`
      <div class="page">
        <header>
          ${wordmark}
          <span style="font: var(--type-mono); opacity: 0.7">session ${this.sessionCode}</span>
        </header>
        ${body}
        ${this.state.broadcast
          ? html`<div class="toast" role="status">${this.state.broadcast.message}</div>`
          : null}
      </div>
    `;
  }
}
