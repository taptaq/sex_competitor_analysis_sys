/**
 * Applies medical vocabulary replacements to the input text.
 * 
 * @param text The original text to process.
 * @param terms The list of medical terms with replacements.
 * @returns The text with marketing terms replaced by professional terms.
 */
export const applyMedicalVocabulary = (text: string, terms: any[]): string => {
  if (!text || !terms || terms.length === 0) return text;

  let processed = text;
  terms.forEach((term: any) => {
    if (term.term && term.replacement) {
        // Use global, case-insensitive replacement
        // Escape special regex characters in the term to avoid errors
        const escapedTerm = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedTerm, "gi");
        processed = processed.replace(regex, term.replacement);
    }
  });
  return processed;
};
