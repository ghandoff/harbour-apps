import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('va-bid-button')
export class VaBidButton extends LitElement {
  @property({ type: Number }) currentHigh = 0;
  @property({ type: Number }) credosRemaining = 0;
  @property({ type: Boolean }) disabled = false;

  @state() private open = false;
  @state() private amount = 0;

  static override styles = css`
    :host { display: inline-block; }
    .cta {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      border-radius: var(--radius-pill);
      padding: var(--space-4) var(--space-7);
      font: var(--type-h2);
      border: none;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-spring);
      box-shadow: var(--shadow-card-lifted);
    }
    .cta:active:not([disabled]) { transform: scale(0.96); }
    .cta[disabled] { opacity: 0.4; cursor: not-allowed; }
    .cta:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }

    .panel {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      box-shadow: var(--shadow-card-lifted);
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    input {
      font: var(--type-h2);
      font-variant-numeric: tabular-nums;
      width: 6ch;
      padding: var(--space-2);
      border-radius: var(--radius-sm);
      border: 2px solid var(--wv-cadet-blue);
      background: var(--bg-card);
    }
    .confirm {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-4);
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .cancel {
      background: transparent;
      color: var(--fg);
      border: 1px solid var(--fg);
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-4);
      cursor: pointer;
    }
  `;

  override update(changed: Map<string, unknown>) {
    super.update(changed);
    if (changed.has('currentHigh') && !this.open) {
      this.amount = this.currentHigh + 5;
    }
  }

  private toggle() {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open && this.amount < this.currentHigh + 1) {
      this.amount = this.currentHigh + 5;
    }
  }

  private confirm() {
    const amount = Math.min(this.credosRemaining, Math.max(this.currentHigh + 1, Math.floor(this.amount)));
    this.dispatchEvent(new CustomEvent('place-bid', { detail: { amount }, bubbles: true, composed: true }));
    this.open = false;
  }

  override render() {
    if (!this.open) {
      return html`<button
        class="cta"
        ?disabled=${this.disabled}
        @click=${this.toggle}
        aria-label="place a bid"
      >bid</button>`;
    }
    const min = this.currentHigh + 1;
    const max = this.credosRemaining;
    return html`
      <div class="panel" role="group" aria-label="bid amount">
        <label>
          <span class="sr-only">amount</span>
          <input
            type="number"
            .value=${String(this.amount)}
            min=${min}
            max=${max}
            @input=${(e: Event) => (this.amount = Number((e.target as HTMLInputElement).value))}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this.confirm(); }}
          />
        </label>
        <button class="confirm" @click=${this.confirm} aria-label="confirm bid">bid ${this.amount}</button>
        <button class="cancel" @click=${() => (this.open = false)}>cancel</button>
      </div>
    `;
  }
}
