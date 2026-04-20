import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { formatClock } from '../utils/timer.js';
import { announce } from '../utils/a11y.js';

@customElement('va-countdown')
export class VaCountdown extends LitElement {
  @property({ type: Number }) startedAt = 0;
  @property({ type: Number }) durationMs = 0;
  @property({ type: Boolean }) ring = false;

  @state() private now = Date.now();
  private interval?: number;
  private lastAnnounced = -1;

  override connectedCallback() {
    super.connectedCallback();
    this.interval = window.setInterval(() => {
      this.now = Date.now();
      this.maybeAnnounce();
    }, 250);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.interval) clearInterval(this.interval);
  }

  private get remainingMs(): number {
    if (!this.startedAt) return this.durationMs;
    return Math.max(0, this.durationMs - (this.now - this.startedAt));
  }

  private maybeAnnounce() {
    const s = Math.ceil(this.remainingMs / 1000);
    if ([10, 5, 3, 2, 1].includes(s) && s !== this.lastAnnounced) {
      announce(`${s} seconds`, 'assertive');
      this.lastAnnounced = s;
    }
  }

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font: var(--type-mono);
      font-size: 18px;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      background: var(--bg-card);
      color: var(--fg);
      font-variant-numeric: tabular-nums;
      transition: background var(--dur-base) var(--ease-in-out),
        color var(--dur-base) var(--ease-in-out);
    }
    :host([urgent]) {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      animation: pulse 1s var(--ease-in-out) infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    .ring {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
    }
    svg { position: absolute; inset: 0; transform: rotate(-90deg); }
    circle.track { fill: none; stroke: rgba(39,50,72,0.1); stroke-width: 8; }
    circle.progress {
      fill: none;
      stroke: var(--wv-cadet-blue);
      stroke-width: 8;
      stroke-linecap: round;
      transition: stroke-dashoffset 0.2s linear, stroke var(--dur-base);
    }
    :host([urgent]) circle.progress { stroke: var(--accent-urgent); }
    .label { position: relative; font-weight: 700; }
  `;

  override update(changed: Map<string, unknown>) {
    super.update(changed);
    const remaining = this.remainingMs;
    const secondsLeft = Math.ceil(remaining / 1000);
    if (secondsLeft <= 10) this.setAttribute('urgent', '');
    else this.removeAttribute('urgent');
  }

  override render() {
    const remaining = this.remainingMs;
    if (this.ring) {
      const r = 54;
      const c = 2 * Math.PI * r;
      const pct = this.durationMs > 0 ? remaining / this.durationMs : 0;
      const offset = c * (1 - pct);
      return html`
        <div class="ring" role="timer" aria-live="polite" aria-label="time remaining: ${formatClock(remaining)}">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle class="track" cx="60" cy="60" r=${r}></circle>
            <circle class="progress" cx="60" cy="60" r=${r} stroke-dasharray=${c} stroke-dashoffset=${offset}></circle>
          </svg>
          <span class="label">${formatClock(remaining)}</span>
        </div>
      `;
    }
    return html`<span role="timer" aria-live="off">${formatClock(remaining)}</span>`;
  }
}
