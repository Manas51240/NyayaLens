import { ExtractedMetadata, LegalParty, DetectedSection } from './types';

/**
 * Extracts structured metadata, parties, dates, jurisdiction, and metrics from normalized legal text.
 */
export function extractMetadata(
  normalizedText: string,
  fileName: string,
  sections: DetectedSection[]
): ExtractedMetadata {
  const lines = normalizedText.split('\n').map((l) => l.trim()).filter(Boolean);
  const textLower = normalizedText.toLowerCase();

  // 1. Title Extraction
  let title = '';
  // Look at first 10 lines for title-like legal captions
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const candidate = lines[i];
    if (
      /agreement|contract|lease|policy|terms|addendum|amendment|deed|undertaking/i.test(candidate) &&
      candidate.length < 80 &&
      !candidate.toLowerCase().startsWith('this')
    ) {
      title = candidate;
      break;
    }
  }
  if (!title) {
    // Fallback to humanized filename without extension
    const baseName = fileName.replace(/\.[a-zA-Z0-9]+$/, '').replace(/[_-]/g, ' ');
    title = baseName.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // 2. Document Type Classification
  let documentType = 'Commercial Agreement';
  if (/employment|employee|employer/i.test(textLower)) {
    documentType = 'Employment Agreement';
  } else if (/lease|landlord|tenant|premises/i.test(textLower)) {
    documentType = 'Commercial Lease Agreement';
  } else if (/non-disclosure|confidentiality agreement|\bnda\b/i.test(textLower)) {
    documentType = 'Non-Disclosure Agreement';
  } else if (/master services agreement|\bsaas\b|software as a service/i.test(textLower)) {
    documentType = 'Master Services Agreement (SaaS)';
  } else if (/independent contractor|consulting agreement|consultant/i.test(textLower)) {
    documentType = 'Independent Contractor Agreement';
  } else if (/software license|end user license|\beula\b/i.test(textLower)) {
    documentType = 'Software License Agreement';
  }

  // 3. Parties Extraction
  const parties: LegalParty[] = [];

  // Pattern 1: "by and between [Party A], as [Role A], and [Party B], as [Role B]"
  const asMatch = normalizedText.match(
    /(?:by\s+and\s+between|between)\s+([A-Z0-9][A-Za-z0-9\s.,&'–-]+?),\s+as\s+([A-Za-z\s]+?),\s+and\s+([A-Z0-9][A-Za-z0-9\s.,&'–-]+?),\s+as\s+([A-Za-z\s]+?)(?:\.|\s+and|\s+for|$)/i
  );

  if (asMatch) {
    const p1 = asMatch[1].trim();
    const r1 = asMatch[2].trim();
    const p2 = asMatch[3].trim();
    const r2 = asMatch[4].trim();
    if (p1.length > 2 && p1.length < 60) parties.push({ name: p1, role: r1 });
    if (p2.length > 2 && p2.length < 60) parties.push({ name: p2, role: r2 });
  } else {
    // Pattern 2: "by and between [Party A] ([Role A]) and [Party B] ([Role B])"
    const betweenMatch = normalizedText.match(
      /(?:by\s+and\s+between|between)\s+([A-Z0-9][A-Za-z0-9\s.,&'–-]+?)(?:\s*\(["']?([A-Za-z0-9\s]+)["']?\))?\s+and\s+([A-Z0-9][A-Za-z0-9\s.,&'–-]+?)(?:\s*\(["']?([A-Za-z0-9\s]+)["']?\))?(?:\.|\s+and|\s+each|$)/i
    );

    if (betweenMatch) {
      const partyAName = betweenMatch[1].trim();
      const partyARole = betweenMatch[2] ? betweenMatch[2].trim() : 'Party A';
      const partyBName = betweenMatch[3].trim();
      const partyBRole = betweenMatch[4] ? betweenMatch[4].trim() : 'Party B';

      if (partyAName.length > 2 && partyAName.length < 60) {
        parties.push({ name: partyAName, role: partyARole });
      }
      if (partyBName.length > 2 && partyBName.length < 60) {
        parties.push({ name: partyBName, role: partyBRole });
      }
    }
  }

  // Fallback party extraction based on roles
  if (parties.length === 0) {
    if (documentType === 'Commercial Lease Agreement') {
      parties.push({ name: 'Landlord / Lessor', role: 'Property Owner' });
      parties.push({ name: 'Tenant / Lessee', role: 'Occupant' });
    } else if (documentType === 'Employment Agreement') {
      parties.push({ name: 'Employing Entity', role: 'Employer' });
      parties.push({ name: 'Executive / Employee', role: 'Employee' });
    } else if (documentType === 'Non-Disclosure Agreement') {
      parties.push({ name: 'Disclosing Party', role: 'Proprietor' });
      parties.push({ name: 'Receiving Party', role: 'Recipient' });
    } else {
      parties.push({ name: 'First Party', role: 'Originator' });
      parties.push({ name: 'Second Party', role: 'Counterparty' });
    }
  }

  // 4. Effective Date Extraction
  let effectiveDate: string | undefined;
  const effMatch = normalizedText.match(
    /(?:effective\s+(?:as\s+of|date:?)|entered\s+into\s+as\s+of|dated(?:\s+as\s+of)?)\s*([A-Za-z]+\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i
  );
  if (effMatch) {
    effectiveDate = effMatch[1].trim();
  }

  // 5. Expiration / Term Date Extraction
  let expirationDate: string | undefined;
  const expMatch = normalizedText.match(
    /(?:terminat(?:es|ing)\s+on|expiration\s+date:?|expires\s+on)\s*([A-Za-z]+\s+[0-9]{1,2},?\s*[0-9]{4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i
  );
  if (expMatch) {
    expirationDate = expMatch[1].trim();
  }

  // 6. Governing Law & Jurisdiction Extraction
  let governingLaw: string | undefined;
  const govMatch = normalizedText.match(
    /governed\s+by(?:,\s*and\s+construed\s+in\s+accordance\s+with,)?\s+the\s+laws\s+of\s+(?:the\s+State\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  );
  if (govMatch) {
    governingLaw = govMatch[1].trim();
  }

  let jurisdiction: string | undefined;
  const jurMatch = normalizedText.match(
    /(?:exclusive\s+)?jurisdiction\s+(?:of\s+the\s+(?:state\s+or\s+federal\s+)?courts\s+(?:located\s+in|of)|venue\s+in)\s+([A-Za-z\s,–-]+?)(?:\.|\s+and|\s+for|$)/i
  );
  if (jurMatch) {
    jurisdiction = jurMatch[1].trim().replace(/,\s*$/, '');
  }

  // 7. Text Metrics
  const charCount = normalizedText.length;
  const wordCount = normalizedText.trim().length > 0 ? normalizedText.trim().split(/\s+/).length : 0;
  const lineCount = lines.length;
  const sectionCount = sections.length;
  const estimatedPageCount = Math.max(1, Math.ceil(wordCount / 500));
  const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    title,
    documentType,
    parties,
    effectiveDate,
    expirationDate,
    governingLaw,
    jurisdiction,
    charCount,
    wordCount,
    lineCount,
    sectionCount,
    estimatedPageCount,
    estimatedReadingTimeMinutes,
  };
}
