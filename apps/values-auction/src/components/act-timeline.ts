import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ACTS } from '../content/acts.js';
import type { ActId } from '../state/types.js';

@customElement('va-act-timeline')
export class VaActTimeline extends LitElement {
  @property({ type: String }) current: ActId = 'arrival';
  @property({ type: Boolean }) interactive = false;

  static override styles = css`
    :host { display: block; }
    ol {
      list-style: none;
      display: flex;
      gap: var(--space-2);
      padding: 0;
      margin: 0;
      flex-wrap: wrap;
    }
    button.pill {
      border: none;
      background: var(--bg-card);
      color: var(--fg);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-pill);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      opacity: 0.55;
      transition: background var(--dur-base), opacity var(--dur-base);
    }
    button.pill.done { opacity: 0.8; }
    button.pill.current {
      background: var(--accent-urgent);
      color: var(--fg-inverse);
      opacity: 1;
    }
    button.pill:not([disabled]):hover { opacity: 1; }
    button[disabled] { cursor: default; }
    button:focus-visible { outline: var(--focus-ring); outline-offset: var(--focus-ring-offset); }
  `;

  private onClick(id: ActId) {
    if (!this.interactive) return;
    this.dispatchEvent(new CustomEvent('jump-act', { detail: { to: id }, bubbles: true, composed: true }));
  }

  override render() {
    const currentOrder = ACTS.find((a) => a.id === this.current)!.order;
    return html`
      <ol role="list" aria-label="session acts">
        ${ACTS.map((a) => {
          const state =
            a.order < currentOrder ? 'done' : a.order === currentOrder ? 'current' : 'upcoming';
          return html`<li>
            <button
              class="pill ${state}"
              ?disabled=${!this.interactive}
              aria-current=${state === 'current' ? 'step' : 'false'}
              @click=${() => this.onClick(a.id)}
            >${a.order}. ${a.name}</button>
          </li>`;
        })}
      </ol>
    `;
  }
}
