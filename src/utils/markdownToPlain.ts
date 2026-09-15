export function markdownToPlain(markdown: string): string {
  if (!markdown) return '';
  let out = markdown;

  out = out.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```[a-zA-Z0-9]*\n?/g, '').replace(/```/g, ''),
  );

  out = out.replace(/`([^`]+)`/g, '$1');
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  out = out.replace(/^\s{0,3}>\s?/gm, '');
  out = out.replace(/^\s{0,3}[-*+]\s+/gm, '• ');
  out = out.replace(/^\s{0,3}\d+\.\s+/gm, '');

  out = out.replace(/(\*\*|__)(.*?)\1/g, '$2');
  out = out.replace(/(\*|_)(.*?)\1/g, '$2');
  out = out.replace(/~~(.*?)~~/g, '$1');

  out = out.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

export function markdownToShareText(markdown: string): string {
  return markdownToPlain(markdown);
}

export function firstLines(input: string, count: number): string {
  const plain = markdownToPlain(input);
  return plain.split('\n').slice(0, count).join('\n');
}