import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface ChannelLine {
  who: string;
  text: string;
  at: number;
}

@customElement('va-team-channel')
export class VaTeamChannel extends LitElement {
  @property({ type: Array }) lines: ChannelLine[] = [];
  @property({ type: String }) displayName = '';

  @state() private text = '';

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      min-height: 240px;
      max-height: 100%;
      box-shadow: var(--shadow-card);
      border-left: 4px solid var(--accent-warm);
    }
    header { font: var(--type-h2); font-size: 14px; opacity: 0.7; margin-bottom: var(--space-2); }
    .lines { flex: 1; overflow-y: auto; }
    .line { margin-bottom: var(--space-2); font-size: 14px; }
    .who { font-weight: 700; color: var(--accent-warm); margin-right: var(--space-2); }
    form { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
    input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border: 1px solid rgba(39,50,72,0.2);
      border-radius: var(--radius-sm);
      background: var(--wv-champagne);
    }
    button {
      background: var(--accent-warm);
      color: var(--fg-inverse);
      border: none;
      border-radius: var(--radius-sm);
      padding: 0 var(--space-4);
      font-weight: 700;
      cursor: pointer;
    }
  `;

  private submit(e: Event) {
    e.preventDefault();
    const t = this.text.trim();
    if (!t) return;
    this.dispatchEvent(new CustomEvent('channel-send', {
      detail: { text: t, who: this.displayName, at: Date.now() },
      bubbles: true,
      composed: true,
    }));
    this.text = '';
  }

  override render() {
    return html`
      <header>team channel</header>
      <div class="lines" aria-live="polite">
        ${this.lines.slice(-20).map((l) => html`
          <div class="line"><span class="who">${l.who}</span>${l.text}</div>
        `)}
      </div>
      <form @submit=${this.submit}>
        <label class="sr-only" for="chan-input">message your team</label>
        <input
          id="chan-input"
          type="text"
          placeholder="say something to your team"
          .value=${this.text}
          @input=${(e: Event) => (this.text = (e.target as HTMLInputElement).value)}
        />
        <button type="submit" aria-label="send">send</button>
      </form>
    `;
  }
}
