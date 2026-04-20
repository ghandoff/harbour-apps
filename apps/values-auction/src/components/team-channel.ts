import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface ChannelMessage {
  at: number;
  from: string;
  text: string;
}

@customElement('va-team-channel')
export class VaTeamChannel extends LitElement {
  @property({ type: Array }) messages: ChannelMessage[] = [];
  @property({ type: String }) displayName = 'you';

  @state() private draft = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--accent-warm);
      color: var(--fg-inverse);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      min-height: 240px;
      max-height: 420px;
    }
    h3 {
      font: var(--type-h2);
      font-size: 16px;
      margin-bottom: var(--space-3);
    }
    ul {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }
    li {
      font: var(--type-small);
    }
    li .name {
      font-weight: 700;
      margin-right: var(--space-2);
    }
    form {
      display: flex;
      gap: var(--space-2);
    }
    input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-pill);
      border: 0;
      background: var(--wv-white);
      color: var(--fg);
      font: var(--type-body);
    }
    input:focus-visible {
      outline: 3px solid var(--wv-cadet-blue);
      outline-offset: 2px;
    }
    button {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      background: var(--wv-cadet-blue);
      color: var(--fg-inverse);
      font-weight: 700;
    }
    button:focus-visible {
      outline: var(--focus-ring);
      outline-offset: var(--focus-ring-offset);
    }
  `;

  private submit(e: Event) {
    e.preventDefault();
    if (!this.draft.trim()) return;
    this.dispatchEvent(
      new CustomEvent('va-channel-send', {
        detail: { text: this.draft.trim() },
        bubbles: true,
        composed: true,
      }),
    );
    this.draft = '';
  }

  render() {
    return html`
      <h3>team channel</h3>
      <ul aria-live="polite">
        ${this.messages.map(
          (m) => html`<li><span class="name">${m.from}:</span>${m.text}</li>`,
        )}
      </ul>
      <form @submit=${(e: Event) => this.submit(e)}>
        <label for="channel-input" class="sr-only">send a message to your team</label>
        <input
          id="channel-input"
          type="text"
          .value=${this.draft}
          placeholder="send a note..."
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
        />
        <button type="submit">send</button>
      </form>
    `;
  }
}
