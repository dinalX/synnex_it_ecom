/**
 * Renders a JSON-LD structured-data script tag. `<` is escaped so product
 * descriptions can never break out of the script context.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
