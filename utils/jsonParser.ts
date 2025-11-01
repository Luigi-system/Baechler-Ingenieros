
import type { AIResponse } from '../types';

/**
 * Extracts and parses a JSON object from a string.
 * It first tries to parse the string directly. If that fails, it looks for a JSON
 * object wrapped in markdown code fences (```json ... ```) and attempts to parse that.
 * @param text The string that may contain a JSON object.
 * @returns The parsed AIResponse object, or null if no valid JSON is found.
 */
export const extractAndParseJson = (text: string): AIResponse | null => {
    try {
        return JSON.parse(text) as AIResponse;
    } catch (e) {
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            try {
                return JSON.parse(jsonMatch[2]) as AIResponse;
            } catch (innerError) {
                console.error("Failed to parse extracted JSON block:", innerError);
                return null;
            }
        }
    }
    return null;
};
