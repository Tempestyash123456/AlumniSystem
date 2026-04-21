/**
 * Simple Base64-based masking for IDs to make URLs look more professional.
 * This is NOT secure encryption, but it obscures raw UUIDs from the address bar.
 */

export const maskId = (id: string): string => {
    if (!id) return '';
    try {
        // Simple shift or obfuscation could be added here
        return btoa(id).replace(/=/g, '');
    } catch (e) {
        return id;
    }
};

export const unmaskId = (maskedId: string): string => {
    if (!maskedId) return '';
    try {
        // Pad with = if needed for valid base64
        let padded = maskedId;
        while (padded.length % 4 !== 0) {
            padded += '=';
        }
        return atob(padded);
    } catch (e) {
        return maskedId;
    }
};
