/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a number if needed
 * @param baseSlug - The base slug
 * @param existingSlug - The existing slug (if updating)
 * @param checkExists - Function to check if a slug exists
 * @returns A unique slug
 */
export async function generateUniqueSlug(
    baseSlug: string,
    existingSlug: string | null,
    checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
    let slug = generateSlug(baseSlug);

    // If updating and slug hasn't changed, keep it
    if (existingSlug && slug === existingSlug) {
        return slug;
    }

    // Check if slug exists and append number if needed
    let counter = 1;
    let uniqueSlug = slug;

    while (await checkExists(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
}
