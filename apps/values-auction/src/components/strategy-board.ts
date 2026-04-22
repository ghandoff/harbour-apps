import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { VALUES } from '@/content/values';
import { COPY } from '@/content/copy';
import type { IntentionZone, Team } from '@/state/types';
import './value-card';

type Zone = 'deck' | 'must' | 'nice' | 'wont';

@customElement('va-strategy-board')
export class VaStrategyBoard extends LitElement {
  @property({ type: Object }) team?: Team;

  @state() private focusedValueId: string | null = null;
  @state() private dragValueId: string | null = null;
  @state() private dragOverZone: Zone | null = null;

  static styles = css`
    :host {
      display: block;
    }
    .hint {
      color: var(--fg-muted);
      margin-bottom: var(--space-4);
    }
    .board {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }
    @media (min-width: 900px) {
      .board {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .zone {
      background: rgba(255, 255, 255, 0.55);
      border: 2px dashed rgba(39, 50, 72, 0.25);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      min-height: 240px;
      transition: background var(--dur-fast) var(--ease-in-out), border-color var(--dur-fast) var(--ease-in-out);
    }
    .zone[data-drag-over='true'] {
      background: rgba(255, 255, 255, 0.9);
      border-style: solid;
    }
    .zone h3 {
      font: var(--type-h2);
      margin-bottom: var(--space-3);
      text-transform: lowercase;
    }
    .zone[data-zone='must'] {
      border-color: var(--wv-redwood);
    }
    .zone[data-zone='nice'] {
      border-color: var(--wv-burnt-sienna);
    }
    .zone ul {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    li[data-dragging='true'] {
      opacity: 0.4;
    }
    li {
      cursor: grab;
    }
    li:active {
      cursor: grabbing;
    }
    .ceiling-input {
      margin-top: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .ceiling-input input {
      width: 80px;
      padding: var(--space-1) var(--space-2);
      border: 1.5px solid var(--wv-cadet-blue);
      border-radius: var(--radius-sm);
      font: var(--type-small);
      font-weight: 700;
    }
    .keyboard-hint {
      color: var(--fg-muted);
      font: var(--type-small);
      margin-top: var(--space-3);
    }
  `;

  private zoneForValue(id: string): Zone {
    const z = this.team?.intentions[id];
    if (z === 'must' || z === 'nice' || z === 'wont') return z;
    return 'deck';
  }

  private setZone(valueId: string, zone: IntentionZone) {
    if (!this.team) return;
    this.dispatchEvent(
      new CustomEvent('va-intention', {
        detail: { teamId: this.team.id, valueId, zone },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private setCeiling(valueId: string, amount: number) {
    if (!this.team) return;
    this.dispatchEvent(
      new CustomEvent('va-ceiling', {
        detail: { teamId: this.team.id, valueId, amount },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private onKey(e: KeyboardEvent, valueId: string) {
    const key = e.key.toLowerCase();
    if (key === 'm') this.setZone(valueId, 'must');
    else if (key === 'n') this.setZone(valueId, 'nice');
    else if (key === 'w') this.setZone(valueId, 'wont');
    else if (key === 'd') this.setZone(valueId, null);
    else return;
    e.preventDefault();
  }

  private onDragStart(e: DragEvent, valueId: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('text/plain', valueId);
    e.dataTransfer.effectAllowed = 'move';
    this.dragValueId = valueId;
  }

  private onDragEnd() {
    this.dragValueId = null;
    this.dragOverZone = null;
  }

  private onDragOver(e: DragEvent, zone: Zone) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    this.dragOverZone = zone;
  }

  private onDragLeave(e: DragEvent, zone: Zone) {
    const related = e.relatedTarget as Node | null;
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      if (this.dragOverZone === zone) this.dragOverZone = null;
    }
  }

  private onDrop(e: DragEvent, zone: Zone) {
    e.preventDefault();
    this.dragOverZone = null;
    const valueId = e.dataTransfer?.getData('text/plain');
    if (!valueId) return;
    this.setZone(valueId, zone === 'deck' ? null : (zone as IntentionZone));
    this.dragValueId = null;
  }

  render() {
    const zones: Zone[] = ['deck', 'must', 'nice', 'wont'];
    const labels: Record<Zone, string> = {
      deck: COPY.strategy.deckLabel,
      must: COPY.strategy.zones.must,
      nice: COPY.strategy.zones.nice,
      wont: COPY.strategy.zones.wont,
    };
    return html`
      <p class="hint">${COPY.strategy.prompt}</p>
      <div class="board">
        ${zones.map(
          (zone) => html`
            <section
              class="zone"
              data-zone=${zone}
              data-drag-over=${this.dragOverZone === zone}
              aria-label=${labels[zone]}
              @dragover=${(e: DragEvent) => this.onDragOver(e, zone)}
              @dragleave=${(e: DragEvent) => this.onDragLeave(e, zone)}
              @drop=${(e: DragEvent) => this.onDrop(e, zone)}
            >
              <h3>${labels[zone]}</h3>
              <ul>
                ${VALUES.filter((v) => this.zoneForValue(v.id) === zone).map(
                  (v) => html`
                    <li
                      tabindex="0"
                      draggable="true"
                      data-dragging=${this.dragValueId === v.id}
                      @dragstart=${(e: DragEvent) => this.onDragStart(e, v.id)}
                      @dragend=${() => this.onDragEnd()}
                      @keydown=${(e: KeyboardEvent) => this.onKey(e, v.id)}
                      @focus=${() => (this.focusedValueId = v.id)}
                      aria-label=${`${v.name}. in ${labels[zone]}. drag to move, or press M, N, W, or D.`}
                    >
                      <va-value-card
                        .value=${v}
                        .zone=${zone === 'deck' ? 'deck' : zone}
                        .ceiling=${this.team?.softCeilings[v.id] ?? 0}
                      ></va-value-card>
                      ${zone === 'must' || zone === 'nice'
                        ? html`
                            <div class="ceiling-input">
                              <label for=${`ceiling-${v.id}`}>${COPY.strategy.ceilingLabel}</label>
                              <input
                                id=${`ceiling-${v.id}`}
                                type="number"
                                min="0"
                                max=${this.team?.credos ?? 150}
                                .value=${String(this.team?.softCeilings[v.id] ?? 0)}
                                @change=${(e: Event) =>
                                  this.setCeiling(
                                    v.id,
                                    Number((e.target as HTMLInputElement).value),
                                  )}
                              />
                            </div>
                          `
                        : ''}
                    </li>
                  `,
                )}
              </ul>
            </section>
          `,
        )}
      </div>
      <p class="keyboard-hint">${COPY.strategy.keyboardHint}</p>
    `;
  }
}
