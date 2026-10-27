/**
 * Renders a JSON-LD structured-data script. Not executable JS (type
 * application/ld+json), so it is safe under the CSP. Use for SEO rich results
 * (Course, VideoObject, …).
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is server-rendered from trusted values.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
