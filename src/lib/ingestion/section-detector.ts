import { DetectedSection } from './types';

// Legal Section Heading Regex Patterns
const LEGAL_HEADING_PATTERNS = [
  // 1. Article headings: ARTICLE I, Article 1, ARTICLE 4 - TERMINATION
  /^(ARTICLE\s+([0-9IVXLCDM]+))(?:\s*[:.\-–—]\s*(.*))?$/i,

  // 2. Section headings: SECTION 1, Section 1.2, SECTION 3: CONFIDENTIALITY
  /^(SECTION\s+([0-9]+(?:\.[0-9]+)*))(?:\s*[:.\-–—]\s*(.*))?$/i,

  // 3. Section symbol: § 1.1, § 4
  /^(§\s*([0-9]+(?:\.[0-9]+)*))(?:\s*[:.\-–—]\s*(.*))?$/,

  // 4. Numbered outlines: "1. DEFINITIONS", "2.1 Scope of Services", "12. Termination"
  /^(([0-9]{1,2}(?:\.[0-9]{1,2})*)\.?)\s+([A-Z][A-Za-z0-9\s,\-–/()]{2,60})$/,

  // 5. Standard Legal Captions in ALL CAPS or Title Case
  /^(RECITALS|WHEREAS|NOW,?\s+THEREFORE|EXHIBIT\s+[A-Z0-9]+|SCHEDULE\s+[A-Z0-9]+|APPENDIX\s+[A-Z0-9]+)(?:\s*[:.\-–—]\s*(.*))?$/i,

  // 6. Major Legal Topic Headings (Standalone line)
  /^(DEFINITIONS|TERM(?:\s+AND\s+TERMINATION)?|COMPENSATION|FEES(?:\s+AND\s+PAYMENT)?|CONFIDENTIALITY|INTELLECTUAL\s+PROPERTY|INDEMNIFICATION|LIMITATION\s+OF\s+LIABILITY|REPRESENTATIONS\s+AND\s+WARRANTIES|DISPUTE\s+RESOLUTION|GOVERNING\s+LAW(?:\s+AND\s+JURISDICTION)?|RESTRICTIVE\s+COVENANTS|NON-COMPETITION|MISCELLANEOUS|GENERAL\s+PROVISIONS)$/i,
];

interface RawSectionMatch {
  title: string;
  sectionNumber?: string;
  lineIndex: number;
}

/**
 * Detects legal section and clause boundaries across lines of normalized text.
 */
export function detectSections(normalizedText: string): DetectedSection[] {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return [];
  }

  const lines = normalizedText.split('\n');
  const detectedHeaders: RawSectionMatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length > 90) {
      // Legal section titles are concise; skip empty lines and long narrative sentences
      continue;
    }

    for (const pattern of LEGAL_HEADING_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        let title = line;
        let sectionNumber: string | undefined;

        if (match[2] && (line.toUpperCase().startsWith('ARTICLE') || line.toUpperCase().startsWith('SECTION') || line.startsWith('§'))) {
          sectionNumber = match[2];
        } else if (match[2] && /^[0-9]/.test(match[2])) {
          sectionNumber = match[2];
        }

        detectedHeaders.push({
          title,
          sectionNumber,
          lineIndex: i,
        });
        break; // Match found, don't check remaining patterns for this line
      }
    }
  }

  // If no structured headings detected, treat the document as a single general section
  if (detectedHeaders.length === 0) {
    return [
      {
        id: 'sec-1',
        title: 'General Provisions',
        text: normalizedText,
        startLine: 1,
        endLine: lines.length,
        charCount: normalizedText.length,
        wordCount: normalizedText.split(/\s+/).length,
      },
    ];
  }

  const sections: DetectedSection[] = [];

  // If there is introductory content before the first detected section (e.g. Title, Preamble)
  if (detectedHeaders[0].lineIndex > 0) {
    const introLines = lines.slice(0, detectedHeaders[0].lineIndex);
    const introText = introLines.join('\n').trim();
    if (introText.length > 0) {
      sections.push({
        id: 'sec-preamble',
        title: 'Preamble & Recitals',
        text: introText,
        startLine: 1,
        endLine: detectedHeaders[0].lineIndex,
        charCount: introText.length,
        wordCount: introText.split(/\s+/).length,
      });
    }
  }

  // Group text for each detected section
  for (let idx = 0; idx < detectedHeaders.length; idx++) {
    const current = detectedHeaders[idx];
    const next = detectedHeaders[idx + 1];

    const startLineIndex = current.lineIndex;
    const endLineIndex = next ? next.lineIndex - 1 : lines.length - 1;

    const sectionLines = lines.slice(startLineIndex, endLineIndex + 1);
    const sectionText = sectionLines.join('\n').trim();

    sections.push({
      id: `sec-${idx + 1}`,
      sectionNumber: current.sectionNumber,
      title: current.title,
      text: sectionText,
      startLine: startLineIndex + 1, // 1-indexed for human readability
      endLine: endLineIndex + 1,
      charCount: sectionText.length,
      wordCount: sectionText.length > 0 ? sectionText.split(/\s+/).length : 0,
    });
  }

  return sections;
}
