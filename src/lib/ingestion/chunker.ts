import { DetectedSection, DocumentChunk } from './types';

const TARGET_CHUNK_CHARS = 1600; // ~400 tokens
const CHUNK_OVERLAP_CHARS = 200; // ~50 tokens

/**
 * Splits legal sections into semantic, searchable chunks with section breadcrumbs and line numbers.
 */
export function chunkSections(sections: DetectedSection[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let globalChunkCounter = 0;

  for (const section of sections) {
    const text = section.text.trim();
    if (!text) continue;

    // Case 1: Section fits neatly into a single chunk
    if (text.length <= TARGET_CHUNK_CHARS) {
      chunks.push({
        id: `chunk-${++globalChunkCounter}`,
        sectionId: section.id,
        sectionTitle: section.title,
        chunkIndex: globalChunkCounter,
        text,
        startLine: section.startLine,
        endLine: section.endLine,
        tokenEstimate: Math.max(1, Math.ceil(text.length / 4)),
      });
      continue;
    }

    // Case 2: Section is long; split into overlapping chunks preserving sentence/paragraph boundaries
    let charCursor = 0;
    const sectionLines = section.text.split('\n');
    const totalChars = text.length;

    while (charCursor < totalChars) {
      let chunkEnd = Math.min(charCursor + TARGET_CHUNK_CHARS, totalChars);

      // If not at the end of the text, look for a logical break point
      if (chunkEnd < totalChars) {
        // Try finding a double newline or newline
        const breakWindow = text.substring(chunkEnd - 150, chunkEnd + 150);
        const paragraphBreak = breakWindow.lastIndexOf('\n\n');
        const newlineBreak = breakWindow.lastIndexOf('\n');
        const sentenceBreak = breakWindow.lastIndexOf('. ');

        if (paragraphBreak !== -1) {
          chunkEnd = (chunkEnd - 150) + paragraphBreak + 2;
        } else if (sentenceBreak !== -1) {
          chunkEnd = (chunkEnd - 150) + sentenceBreak + 2;
        } else if (newlineBreak !== -1) {
          chunkEnd = (chunkEnd - 150) + newlineBreak + 1;
        }
      }

      const chunkText = text.substring(charCursor, chunkEnd).trim();

      if (chunkText.length > 0) {
        // Approximate start and end line within the section
        const charsBefore = charCursor;
        const charsInChunk = chunkText.length;

        let accumulatedChars = 0;
        let chunkStartLine = section.startLine;
        let chunkEndLine = section.endLine;

        for (let l = 0; l < sectionLines.length; l++) {
          accumulatedChars += sectionLines[l].length + 1; // +1 for newline
          if (accumulatedChars >= charsBefore && chunkStartLine === section.startLine) {
            chunkStartLine = section.startLine + l;
          }
          if (accumulatedChars >= charsBefore + charsInChunk) {
            chunkEndLine = section.startLine + l;
            break;
          }
        }

        chunks.push({
          id: `chunk-${++globalChunkCounter}`,
          sectionId: section.id,
          sectionTitle: section.title,
          chunkIndex: globalChunkCounter,
          text: chunkText,
          startLine: chunkStartLine,
          endLine: Math.max(chunkStartLine, chunkEndLine),
          tokenEstimate: Math.max(1, Math.ceil(chunkText.length / 4)),
        });
      }

      if (chunkEnd >= totalChars) {
        break;
      }

      // Advance cursor with overlap
      charCursor = chunkEnd - CHUNK_OVERLAP_CHARS;
      if (charCursor <= 0 || charCursor <= charCursor - TARGET_CHUNK_CHARS) {
        charCursor = chunkEnd;
      }
    }
  }

  return chunks;
}
