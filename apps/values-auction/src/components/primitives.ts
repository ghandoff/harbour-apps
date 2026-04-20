import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('va-card')
export class VaCard extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-card);
      padding: var(--space-5);
      color: var(--fg);
      transition: transform var(--dur-base) var(--ease-out-quart),
        box-shadow var(--dur-base) var(--ease-out-quart);
    }
    :host([interactive]:hover),
    :host([interactive]:focus-within) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-card-lifted);
    }
    :host([deep]) {
      background: var(--bg-deep);
      color: var(--fg-inverse);
    }
  `;
  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('va-button')
export class VaButton extends LitElement {
  @property({ type: String }) variant: 'primary' | 'urgent' | 'ghost' = 'primary';
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' = 'button';

  static override styles = css`
    :host {
      display: inline-block;
    }
    button {
      font: var(--type-body);
      font-weight: 700;
      letter-spacing: 0.01em;
      border-radius: var(--radius-pill);
      padding: var(--space-3) var(--space-5);
      min-height: 44px;
      cursor: pointer;
      transition: transform var(--dur-fast) var(--ease-spring),
        background var(--dur-base) var(--ease-in-out),
        box-shadow var(--dur-base) var(--ease-in-out);
      border: 2px solid transparent;
    }
    button:active:not([disabled]) { transform: scale(0.97); }
    button[disabled] { opacity: 0.4; cursor: not-allowed; }

    button.primary {
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
    }
    button.primary:hover:not([disabled]) { background: #1a2033; }

    button.urgent {
      background: var(--wv-redwood);
      color: var(--fg-inverse);
    }
    button.urgent:hover:not([disabled]) { background: #9a4338; }

    button.ghost {
      background: transparent;
      color: var(--fg);
      border-color: var(--wv-cadet-blue);
    }
    button.ghost:hover:not([disabled]) { background: rgba(39, 50, 72, 0.06); }

    button:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }
  `;

  override render() {
    return html`<button
      class=${this.variant}
      ?disabled=${this.disabled}
      type=${this.type}
      @click=${(e: Event) => {
        if (this.disabled) {
          e.stopPropagation();
          return;
        }
      }}
    >
      <slot></slot>
    </button>`;
  }
}

@customElement('va-chip')
export class VaChip extends LitElement {
  @property({ type: Number }) count = 0;
  @property({ type: String }) label = 'credos';
  @property({ type: Boolean }) urgent = false;

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
      color: var(--fg);
      font: var(--type-body);
      font-weight: 700;
      box-shadow: var(--shadow-card);
      transition: transform var(--dur-base) var(--ease-spring), background var(--dur-base);
    }
    :host([urgent]) { background: var(--accent-urgent); color: var(--fg-inverse); }
    .count { font-variant-numeric: tabular-nums; font-size: 18px; }
    .label { font-weight: 400; font-size: 13px; opacity: 0.7; }
  `;

  override render() {
    return html`<span class="count">${this.count}</span><span class="label">${this.label}</span>`;
  }
}
