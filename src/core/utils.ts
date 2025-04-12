/**
 * Helper function to format query parameters for HTTP requests.
 * Converts Date objects to ISO strings and removes undefined/null values.
 * @param {Record<string, any>} params - The parameters object.
 * @returns {Record<string, string | number | boolean>} Formatted parameters.
 */
export function formatQueryParams(params: Record<string, any>): Record<string, string | number | boolean> {
    const formatted: Record<string, string | number | boolean> = {};
    for (const key in params) {
        if (params[key] instanceof Date) {
            formatted[key] = params[key].toISOString();
        } else if (params[key] !== undefined && params[key] !== null) {
            // Only include defined, non-null values
            formatted[key] = params[key];
        }
    }
    return formatted;
}

// Add other utility functions here as needed 