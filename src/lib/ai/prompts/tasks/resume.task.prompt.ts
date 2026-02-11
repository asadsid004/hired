interface ResumeExtractionInput {
    text: string;
    links: string[];
}

export function buildResumeExtractionPrompt({
    text,
    links,
}: ResumeExtractionInput): string {
    return `Extract all information from this resume into a structured format.

## Resume Text:
${text}

## Extracted Links:
${links.length > 0 ? links.map((link, i) => `${i + 1}. ${link}`).join('\n') : 'No links provided'}

## Instructions:
1. Parse the resume text thoroughly and extract ALL information
2. Cross-reference the links array to identify social profiles and project URLs
3. Categorize skills appropriately (languages, frameworks, ML/AI, DevOps, databases, tools, other)
4. Convert all dates to YYYY-MM format
5. Separate achievements from job descriptions (achievements show measurable impact)
6. Use null for any genuinely missing information - do NOT fabricate data

## Expected Output:
Return a complete ResumeProfile JSON object with all available information structured according to the schema.

Parse carefully and extract everything available.`;
}