export const INTERVIEW_TASK_PROMPT = (jobRole: string, jobDescription: string, interviewType: string, difficulty: string, transcript: string) => `Analyze the following interview session:

### CONTEXT
- **Job Role**: ${jobRole ?? "General"}
- **Expected Difficulty**: ${difficulty ?? "Medium"}
- **Interview Type**: ${interviewType ?? "Mixed/Technical"}
- **Job Description**: ${jobDescription ?? "N/A"}

### INTERVIEW TRANSCRIPT
${transcript}

### EVALUATION FORM
Provide your analysis strictly matching the requested JSON schema:`