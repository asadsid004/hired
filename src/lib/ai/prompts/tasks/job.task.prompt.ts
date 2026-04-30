export function buildJobDescriptionParsingPrompt(params: {
    jobTitle: string;
    company: string;
    description: string;
}): string {
    return `Parse the following job posting and extract structured data.

Job Title: ${params.jobTitle}
Company: ${params.company}

--- RAW JOB DESCRIPTION ---
${params.description}
--- END ---

Extract all structured fields from this job description. Be thorough but only include what is explicitly stated.`;
}
