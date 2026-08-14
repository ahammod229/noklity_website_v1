export interface ProductFaqItem {
  question: string;
  answer: string;
}

export const normalizeProductFaqItems = (faqText: string | undefined): ProductFaqItem[] => {
  const raw = String(faqText || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const jsonItems = parsed
        .map((item) => {
          const source = (item || {}) as Record<string, unknown>;
          return {
            question: String(source.question || source.q || '').trim(),
            answer: String(source.answer || source.a || '').trim()
          };
        })
        .filter((item) => item.question && item.answer);

      if (jsonItems.length > 0) {
        return jsonItems;
      }
    }
  } catch {
    // Ignore malformed JSON and continue parsing text formats.
  }

  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const items: ProductFaqItem[] = [];

  for (const line of lines) {
    const pipeParts = line.split('|').map((part) => part.trim()).filter(Boolean);
    if (pipeParts.length >= 2) {
      items.push({
        question: pipeParts[0],
        answer: pipeParts.slice(1).join(' | ')
      });
      continue;
    }

    const qIndex = line.toLowerCase().indexOf('q:');
    const aIndex = line.toLowerCase().indexOf('a:');
    if (qIndex !== -1 && aIndex !== -1 && aIndex > qIndex) {
      items.push({
        question: line.slice(qIndex + 2, aIndex).trim(),
        answer: line.slice(aIndex + 2).trim()
      });
      continue;
    }

    const separatorMatch = line.match(/^(.*?)\s*(?:->|—| - |:)\s*(.+)$/);
    if (separatorMatch) {
      items.push({
        question: separatorMatch[1].trim(),
        answer: separatorMatch[2].trim()
      });
      continue;
    }
  }

  if (items.length > 0) {
    return items.filter((item) => item.question && item.answer);
  }

  const blocks = raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const blockItems = blocks
    .map((block) => {
      const blockLines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      if (blockLines.length < 2) return null;
      return {
        question: blockLines[0],
        answer: blockLines.slice(1).join('\n')
      };
    })
    .filter((item): item is ProductFaqItem => Boolean(item?.question && item?.answer));

  if (blockItems.length > 0) {
    return blockItems;
  }

  const pairedItems: ProductFaqItem[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    const question = lines[index];
    const answer = lines[index + 1];
    if (question && answer) {
      pairedItems.push({ question, answer });
    }
  }

  if (pairedItems.length > 0) {
    return pairedItems;
  }

  return [
    {
      question: 'Product FAQ',
      answer: raw
    }
  ];
};
