"use client";

/**
 * RoomGrid — the entry screen for Room Explorer.
 *
 * Shows 5-6 illustrated room cards as big, tappable tiles.
 * Each card is an invitation to explore: "what's hiding in the kitchen?"
 *
 * The rooms aren't categories — they're provocations. They ask kids
 * to look at a familiar place with fresh eyes.
 *
 * Designed to sit on a cadet-blue background.
 */

import { RoomConfig } from "./room-config";

interface RoomGridProps {
  rooms: RoomConfig[];
  visitedRooms: Set<string>;
  selectedCountByRoom: Map<string, number>;
  onRoomTap: (room: RoomConfig) => void;
}

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function RoomGrid({
  rooms,
  visitedRooms,
  selectedCountByRoom,
  onRoomTap,
}: RoomGridProps) {
  return (
    <div>
      <p
        className="text-sm mb-5 text-center"
        style={{ color: "var(--wv-champagne)", opacity: 0.6 }}
      >
        pick a place and see what you notice
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rooms.map((room) => {
          const count = selectedCountByRoom.get(room.id) ?? 0;
          const visited = visitedRooms.has(room.id);

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onRoomTap(room)}
              className="room-card relative flex flex-col items-center justify-center text-center rounded-2xl border-2 p-4 select-none active:scale-[0.96]"
              style={{
                "--room-color": room.color,
                minHeight: 130,
                borderColor: count > 0
                  ? room.color
                  : visited
                    ? `color-mix(in srgb, ${room.color} 25%, transparent)`
                    : "rgba(255, 255, 255, 0.1)",
                backgroundColor: count > 0
                  ? `color-mix(in srgb, ${room.color} 12%, rgba(39, 50, 72, 0.8))`
                  : "rgba(255, 255, 255, 0.06)",
                boxShadow: count > 0
                  ? `0 2px 12px color-mix(in srgb, ${room.color} 20%, transparent)`
                  : "0 1px 4px rgba(0,0,0,0.1)",
                transition: `all 250ms ${SPRING}`,
                WebkitTapHighlightColor: "transparent",
              } as React.CSSProperties}
            >
              {/* count badge */}
              {count > 0 && (
                <span
                  className="absolute -top-2 -right-2 rounded-full flex items-center justify-center font-bold"
                  style={{
                    width: 24,
                    height: 24,
                    fontSize: "0.7rem",
                    backgroundColor: room.color,
                    color: "var(--wv-white)",
                    animation: `roomBadgePop 300ms ${SPRING}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                  }}
                >
                  {count}
                </span>
              )}

              {/* room emoji */}
              <span
                className="text-3xl mb-1.5"
                style={{ transition: `transform 250ms ${SPRING}` }}
              >
                {room.emoji}
              </span>

              {/* room label */}
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: count > 0 ? room.color : "var(--wv-champagne)" }}
              >
                {room.label}
              </span>

              {/* description */}
              <span
                className="text-xs mt-0.5 leading-snug"
                style={{
                  color: "var(--wv-champagne)",
                  opacity: 0.4,
                  fontSize: "0.6rem",
                }}
              >
                {room.description}
              </span>

              {/* visited indicator */}
              {visited && count === 0 && (
                <span
                  className="absolute top-2 right-2 text-xs"
                  style={{ opacity: 0.3 }}
                  aria-label="visited"
                >
                  👀
                </span>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes roomBadgePop {
          from { transform: scale(0); }
          60%  { transform: scale(1.3); }
          to   { transform: scale(1); }
        }
        .room-card:hover {
          transform: scale(1.03);
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes roomBadgePop { from, to { transform: scale(1); } }
          .room-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
}
