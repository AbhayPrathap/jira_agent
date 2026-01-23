export function extractJsonBlock(content: string): string | null {
    const cleaned = content
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return null;
    }

    return cleaned.substring(firstBrace, lastBrace + 1);
}

export function extractArrayByKey(content: string, key: string): string[] | string {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, 's');
    const match = content.match(regex);

    if (!match || !match[1]) {
        return [];
    }

    return match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('"'))
        .map(line =>
            line
                .replace(/^"/, '')
                .replace(/",?$/, '')
                .trim()
        )
        .filter(Boolean);
}