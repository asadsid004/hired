import { JobPreferenceInsert } from "@/db/schema";

interface ResumeExtractionInput {
   text: string;
   links: string[];
}

export function buildResumeExtractionPrompt({
   text,
   links,
}: ResumeExtractionInput): string {
   return `Extract ALL information from this resume into a structured format. Your goal is COMPLETE extraction with ZERO loss of information.

## Resume Text:
${text}

## Extracted Links:
${links.length > 0 ? links.map((link, i) => `${i + 1}. ${link}`).join('\n') : 'No links provided'}

## CRITICAL EXTRACTION RULES:

### 1. VERBATIM TEXT EXTRACTION:
- Copy ALL text EXACTLY as written in the resume
- Do NOT summarize, paraphrase, or rewrite anything
- Do NOT combine multiple bullet points into one
- Do NOT shorten or condense descriptions
- Preserve original wording, phrasing, and terminology

### 2. BULLET POINTS:
**Each bullet point = One array item**
- If the resume has 5 bullet points under a job, extract all 5 as separate strings
- If the resume has 10 bullet points under a project, extract all 10 as separate strings
- NEVER combine multiple bullets into one
- NEVER summarize bullets
- Keep original text word-for-word

### 3. COMPLETE SKILL EXTRACTION:
- Extract EVERY single skill mentioned in the resume
- Check Experience, Projects, Skills section, Summary
- Include ALL programming languages, frameworks, tools, technologies
- Categorize into: languages, frameworks, mlAndAi, devops, databases, tools, other

### 4. ALL SECTIONS:
Extract from ALL these sections if present:
- Personal Information (name, email, phone, location)
- Professional Summary/Objective (complete text, not summarized)
- Work Experience (ALL jobs with ALL details)
- Projects (ALL projects with ALL details)
- Education (ALL degrees/schools)
- Skills (ALL skills mentioned)
- Certifications (ALL certifications)
- Achievements/Awards (ALL items)
- Languages (ALL languages)
- Social Links (ALL links from text and links array)

### 5. CROSS-REFERENCE:
- Match links from the provided links array to appropriate sections
- Identify GitHub repos → add to projects if relevant
- Identify LinkedIn → add to socials
- Identify portfolio sites → add to socials

### 6. DATE FORMATTING:
- Convert: "Jan 2024" → "2024-01"
- Convert: "January 2024" → "2024-01"
- Convert: "2024" → "2024-01" (assume January if only year given)
- For ongoing: endDate = null, isCurrent = true

### 7. NULL HANDLING:
- Use null ONLY for genuinely missing information
- Do NOT use null if information exists but needs parsing
- Do NOT fabricate data - if it's not there, use null

## EXTRACTION CHECKLIST:
Before submitting, verify you have:
- [ ] Extracted EVERY bullet point individually (count them!)
- [ ] Copied ALL descriptions exactly as written (no paraphrasing)
- [ ] Found ALL skills mentioned anywhere in the resume
- [ ] Extracted ALL social links from both text and links array
- [ ] Included ALL experiences, projects, education, certifications
- [ ] Preserved original wording throughout
- [ ] Converted ALL dates to YYYY-MM format
- [ ] Set isCurrent=true for ongoing roles/education

## Expected Output:
Return a complete ResumeProfile JSON object with:
- personalInfo: Complete contact information
- socials: ALL social links found
- summary: Complete professional summary (exact text)
- skills: ALL skills categorized appropriately
- experience: ALL jobs with EACH bullet point separate
- projects: ALL projects with EACH bullet point separate
- education: ALL degrees/schools
- certifications: ALL certifications
- achievements: ALL achievements as separate items
- languages: ALL languages

**REMEMBER**: Quality = Completeness + Verbatim Text. Do NOT skip or summarize anything.

Parse carefully and extract EVERYTHING available with ZERO information loss.`;
}

export function ATSAnalysisPrompt(): string {
   return `Analyze this resume file for ATS (Applicant Tracking System) compatibility.

## File Information:
- The file has been uploaded and you can see its visual layout and formatting

## Analysis Instructions:

1. **Examine the Visual Layout (Formatting)**:
   - Check for tables, columns, text boxes, images
   - Verify font consistency and sizes
   - Assess spacing and margins
   - Look for headers/footers
   - Identify any special characters or non-standard formatting

2. **Evaluate Structure**:
   - Check section headers (are they standard like "Experience", "Education", "Skills"?)
   - Verify logical section order
   - Check date formatting consistency
   - Ensure contact info is clearly visible at the top
   - Verify company names are separated from job titles

3. **Assess Readability**:
   - Font sizes appropriate (10-12pt)?
   - Adequate white space and margins?
   - Clear visual hierarchy?
   - Bullet points well-formatted and concise?
   - No dense text blocks?

4. **Check Length**:
   - Count pages
   - Assess if length matches experience level (1 page for 0-5 years, 1-2 for 5-15 years)
   - Check for unnecessary or irrelevant content

## Output Structure:

### score (number 0-100):
- Calculate a single overall ATS compatibility score
- Consider all four dimensions with equal weight (25% each):
  * Formatting: Tables, fonts, special characters, headers/footers
  * Structure: Section headers, order, dates, contact info
  * Readability: Font size, white space, hierarchy, bullet points
  * Length: Page count vs experience level
- Deduct more points for critical issues than warnings or info issues
- Score >= 70 = good ATS compatibility

### issues (array):
For each problem found, create an issue object with:
- **category**: 'formatting', 'structure', 'length', or 'readability'
- **severity**: 
  * 'critical' = Will break ATS parsing or cause key info to be missed
  * 'warning' = May cause parsing issues but resume will likely still work
  * 'info' = Best practice suggestions for minor improvements
- **message**: Clear, specific description of what's wrong (e.g., "Resume uses a 2-column table layout in the experience section")
- **suggestion**: Actionable fix (e.g., "Remove the table and use a single-column layout with clear section headers")

Order issues by severity (critical first), then by category.

### strengths (array of strings):
- List 3-5 specific positive aspects about ATS compatibility
- Be concrete (e.g., "Uses standard section headers like 'Work Experience' and 'Education'" not just "Good structure")
- Focus on what helps with ATS parsing

## Scoring Guidelines:
- Start at 100 and deduct points:
  * Critical formatting issues: -15 to -25 points each
  * Critical structure issues: -15 to -20 points each
  * Warning-level issues: -5 to -10 points each
  * Info-level issues: -2 to -5 points each
- Balance deductions with the number and severity of issues found

Be thorough, specific, and actionable. Focus on issues that actually impact ATS parsing.`;
}

export function buildSectionAnalysisPrompt(resumeText: string): string {
   return `Analyze this resume's section completeness and structure.

## Resume Text:
${resumeText}

## Analysis Instructions:

1. **Identify All Present Sections**:
   - Contact Information
   - Professional Summary/Objective
   - Work Experience
   - Education
   - Skills
   - Projects
   - Certifications
   - Achievements/Awards
   - Languages
   - Volunteer Work
   - Publications
   - Other sections

2. **Assess Each Present Section's Quality**:
   - Is the content substantial?
   - Is it well-organized?
   - Does it add value?
   - Rate: excellent, good, average, or poor.

3. **Identify Missing Sections**:
   - Classify importance: critical, recommended, or optional
   - Explain why it matters
   - Describe the impact of its absence

4. **Consider Context**:
   - What role/industry might this be for?
   - What's the experience level?
   - Are sections appropriate for the candidate's stage?

5. **Calculate Scores**:
   - Critical sections (60%): All 3 present and good quality?
   - Recommended sections (30%): Skills and Summary present?
   - Optional sections (10%): Any additional sections?
   - Overall score = sum of above

6. **Provide Suggestions**:
   - What sections should be added?
   - How can existing sections be improved?
   - What's the priority order?

7. **Write Summary**:
   - Overall completeness assessment
   - Key strengths in structure
   - Most important missing element

Be specific and consider the candidate's context when evaluating sections.`;
}

export function buildSemanticAnalysisPrompt(
   resumeText: string,
   jobPreferences: Omit<JobPreferenceInsert, "id" | "userId" | "createdAt" | "updatedAt">
): string {
   return `Analyze this resume's content quality, focusing on clarity, impact, and relevance.

## Resume Text:
${resumeText}

## Candidate's Job Preferences:
- **Target Roles**: ${jobPreferences.role.join(', ')}
- **Work Mode**: ${jobPreferences.mode}
- **Locations**: ${jobPreferences.location?.join(', ') || 'Not specified'}
- **Job Type**: ${jobPreferences.type}

## Analysis Instructions:

### 1. CLARITY Analysis (Score 0-100):
Evaluate how clearly and concisely the resume communicates:

**What to Check**:
- Are bullet points concise and scannable (under 2 lines)?
- Is jargon explained or minimized?
- Are acronyms spelled out on first use?
- Can someone understand the resume in 6 seconds?
- Is there clear subject-verb-object structure?
- Are there dense paragraphs that should be bullets?

**Scoring Guide**:
- 90-100: Crystal clear, highly scannable, no jargon issues
- 70-89: Mostly clear with minor verbosity or jargon
- 50-69: Some confusing language, excessive jargon, or dense text
- 0-49: Very unclear, heavy jargon, impossible to scan quickly

**Feedback**: Write 2-3 sentences explaining:
- What's clear and well-written
- What's confusing or verbose
- Specific examples of jargon or unclear language

### 2. IMPACT Analysis (Score 0-100):
Evaluate how well achievements are demonstrated:

**What to Check**:
- Are achievements quantified with numbers, percentages, or metrics?
- Do bullets show RESULTS instead of just responsibilities?
- Are strong action verbs used (Led, Developed, Increased vs Responsible for, Worked on)?
- Is business value/impact clear?
- Are achievements contextualized (scale, scope, timeframe)?

**Scoring Guide**:
- 90-100: Every bullet quantified, clear results, strong verbs
- 70-89: Most bullets show impact, good quantification
- 50-69: Some quantification, mix of tasks and achievements
- 0-49: No metrics, only lists responsibilities, passive language

**Feedback**: Write 2-3 sentences explaining:
- How well achievements are quantified
- Quality of action verbs used
- Examples of strong vs weak bullets

### 3. RELEVANCE Analysis (Score 0-100):
Evaluate content appropriateness for target roles (${jobPreferences.role.join(', ')}):

**What to Check**:
- Is all content relevant to target roles?
- Is recent/important information prioritized?
- Is outdated or irrelevant content removed?
- Are skills aligned with ${jobPreferences.role.join(', ')} requirements?
- Is experience organized logically?
- Does the resume position the candidate for these specific roles?

**Scoring Guide**:
- 90-100: Every line adds value, perfect alignment with target roles
- 70-89: Mostly relevant, good organization, minor irrelevant details
- 50-69: Some irrelevant content, poor prioritization
- 0-49: Lots of irrelevant info, poor organization, wrong positioning

**Feedback**: Write 2-3 sentences explaining:
- What content is highly relevant to target roles
- What should be removed or deprioritized
- How well the resume is positioned for ${jobPreferences.role.join(', ')}

### 4. IDENTIFY IMPROVEMENTS (5-10 specific suggestions):
For each improvement, provide:
- **section**: Which part of the resume (e.g., "Work Experience - Software Engineer at Google", "Skills Section", "Professional Summary")
- **current**: The exact current text that needs improvement
- **suggested**: The improved version with better clarity/impact/relevance
- **reason**: Why this change improves the resume (be specific about impact)

**Focus on**:
- Converting responsibilities to achievements with metrics
- Removing jargon or simplifying language
- Adding missing keywords for ${jobPreferences.role.join(', ')}
- Removing irrelevant content
- Strengthening weak bullets with quantification
- Improving alignment with target roles

**Example**:
- section: "Work Experience - Marketing Manager"
- current: "Responsible for managing social media accounts"
- suggested: "Managed 5 social media accounts, growing follower base by 150% and increasing engagement rate from 2% to 8% in 6 months"
- reason: "Adds specific metrics (150% growth, 2% to 8%), quantifies scope (5 accounts), and shows timeframe (6 months) instead of just listing responsibility"

### 5. IDENTIFY KEYWORD GAPS (5-10 keywords):
Based on common job descriptions for ${jobPreferences.role.join(', ')}, list missing keywords:

**What to Include**:
- Technical skills commonly required for ${jobPreferences.role.join(', ')}
- Tools and frameworks mentioned in job postings
- Industry-standard methodologies
- Certifications or qualifications
- Soft skills frequently requested
- Domain-specific terminology

**Examples for different roles**:
- Software Engineer: React, TypeScript, AWS, CI/CD, Agile, REST APIs
- Data Analyst: SQL, Python, Tableau, Excel, Data Visualization, Statistical Analysis
- Product Manager: Roadmap, Stakeholder Management, A/B Testing, User Research, Metrics

Focus on high-value keywords that appear frequently in ${jobPreferences.role.join(', ')} job descriptions.

## Scoring Summary:
- Calculate **score** = (clarity score + impact score + relevance score) / 3
- All scores must be integers (0-100)
- Be honest but constructive

Provide specific, actionable feedback that helps this candidate optimize their resume for: ${jobPreferences.role.join(', ')}.`;
}