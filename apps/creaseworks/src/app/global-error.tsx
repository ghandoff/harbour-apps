"use client";

/**
 * Root-level error boundary — catches errors in the root layout itself.
 *
 * Unlike error.tsx (which only catches errors in page components),
 * global-error.tsx wraps the entire <html> element and catches errors
 * that occur in the root layout, including font loading failures,
 * cookie parsing issues, and other initialization errors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#273248",
          color: "#ffebd2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#cb7858",
              marginBottom: "16px",
            }}
          >
            something went wrong
          </h1>
          <p style={{ opacity: 0.7, marginBottom: "24px", maxWidth: 400 }}>
            creaseworks hit an unexpected error. you can try again or come back
            in a few minutes.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#cb7858",
                color: "#273248",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              try again
            </button>
            <a
              href="/reservoir/creaseworks"
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cb7858",
                color: "#cb7858",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
