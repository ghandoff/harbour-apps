import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('va-credos-stack')
export class VaCredosStack extends LitElement {
  @property({ type: Number }) credos = 0;
  @property({ type: Number }) start = 150;

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      background: var(--bg-card);
      border-radius: var(--radius-pill);
      padding: var(--space-2) var(--space-4);
      box-shadow: var(--shadow-card);
      font-weight: 700;
    }
    .coin {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: var(--wv-burnt-sienna);
      display: grid; place-items: center;
      color: var(--fg-inverse);
      font-size: 12px;
    }
    .count { font-variant-numeric: tabular-nums; font-size: 18px; }
    .label { font-weight: 400; opacity: 0.7; font-size: 13px; }
    .bar {
      margin-left: var(--space-3);
      width: 64px;
      height: 6px;
      background: rgba(39, 50, 72, 0.1);
      border-radius: var(--radius-pill);
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background: var(--wv-cadet-blue);
      transition: width var(--dur-slow) var(--ease-out-quart);
    }
  `;

  override render() {
    const pct = this.start > 0 ? Math.max(0, Math.min(1, this.credos / this.start)) : 0;
    return html`
      <span class="coin" aria-hidden="true">¢</span>
      <span class="count" aria-live="polite">${this.credos}</span>
      <span class="label">credos</span>
      <span class="bar" aria-hidden="true"><span class="bar-fill" style="width: ${pct * 100}%"></span></span>
    `;
  }
}
