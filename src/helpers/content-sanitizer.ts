import sanitizeHtml from "sanitize-html";

const richTextOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "a",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: "a",
      attribs: {
        href: attribs.href ?? "#",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
  },
};

export function sanitizeRichText(input?: string | null) {
  if (!input) return "";
  return sanitizeHtml(input, richTextOptions).trim();
}

export function sanitizePlainText(input?: string | null) {
  if (!input) return "";
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).trim();
}
