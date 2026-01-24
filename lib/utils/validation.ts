
/**
 * Validates the content of a collection note.
 * Rules:
 * 1. No URLs or domains (e.g. example.com, http://...)
 * 2. Max length: 280 characters
 * 3. Allow @mentions (e.g. @ChatGPT)
 * 
 * @param content The note content to validate
 * @returns { isValid: boolean, error?: string }
 */
export function validateNoteContent(content: string): { isValid: boolean; error?: string } {
    if (!content) return { isValid: true };

    if (content.length > 280) {
        return { isValid: false, error: "Note cannot exceed 280 characters." };
    }

    // Regex to detect common URL patterns
    // Matches http://, https://, www., .com, .net, .org, etc.
    // This is a basic detector, not RFC compliant but good enough for simple text.
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.(com|net|org|io|ai|co|id|my)\b)/i;

    if (urlPattern.test(content)) {
        return { isValid: false, error: "Links/URLs are not allowed in notes. Use '@ToolName' to reference tools instead." };
    }

    return { isValid: true };
}
