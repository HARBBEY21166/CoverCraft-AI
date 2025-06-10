// src/ai/flows/cv-adaptation.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for adapting a CV to a specific job description.
 *
 * - adaptCv - A function that takes a CV and job description as input and returns an adapted CV.
 * - AdaptCvInput - The input type for the adaptCv function.
 * - AdaptCvOutput - The return type for the adaptCv function.
 * 
 * Updates for ATS compliance:
 * 1. Standardized section headers
 * 2. Explicit keyword mirroring requirement
 * 3. Improved link handling
 * 4. Word limit enforcement
 * 5. Placeholder validation
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptCvInputSchema = z.object({
  cv: z.string().describe('The plain text content of the original CV.'),
  jobDescription: z.string().describe('The job description for the target position.'),
});
export type AdaptCvInput = z.infer<typeof AdaptCvInputSchema>;

const AdaptCvOutputSchema = z.object({
  adaptedCv: z.string().describe('The adapted CV tailored to the job description. This should be a complete CV, adapting all relevant sections from the original CV. If present, the summary should align with the target job role and highlight no more than one primary role. The Skills section should be tailored to the job description. The Work Experience section should be concise, featuring a maximum of 3 most relevant work experiences (each with a maximum of 3 bullet points). The entire output should not contain any placeholder text and should not omit sections from the original CV unless they are entirely irrelevant to the job description after adaptation.'),
});
export type AdaptCvOutput = z.infer<typeof AdaptCvOutputSchema>;

export async function adaptCv(input: AdaptCvInput): Promise<AdaptCvOutput> {
  return adaptCvFlow(input);
}

const adaptCvPrompt = ai.definePrompt({
  name: 'adaptCvPrompt',
  input: {schema: AdaptCvInputSchema},
  output: {schema: AdaptCvOutputSchema},
  prompt: `You are an expert resume writer. Your task is to adapt the Original CV to the provided Job Description, creating a complete ATS-optimized resume.

Critical instructions for the "adaptedCv" output:
1.  Use standardized section headers: "Contact Information", "Summary", "Skills", "Work Experience", "Education", "Certifications", "Interest". Map any non-standard sections from the Original CV to these headers.

2.  If a "Summary" section is present:
    a.  Align it strongly with the target job role
    b.  Highlight only one primary role
    c.  Integrate 3-5 keywords from the Job Description

3.  For the "Skills" section:
    a.  Prioritize skills mentioned in the Job Description
    b.  Mirror exact keywords from the Job Description
    c.  Categorize skills as "Technical", "Professional", or "Certifications" where applicable

4.  For "Work Experience":
    a.  Include maximum 3 relevant positions (prioritized by JD alignment)
    b.  Each position: maximum 3 bullet points
    c.  Start bullet points with strong action verbs
    d.  Integrate keywords from the Job Description
    e.  Quantify achievements where possible (e.g., "increased efficiency by 15%")

5.  For other sections (Education, Certifications, etc.):
    a.  Maintain original information but prioritize JD-relevant content
    b.  Include completion dates in YYYY-MM format

6.  Link handling rules:
    a.  PRESERVE valid URLs (https://...)
    b.  REMOVE placeholders like [Portfolio Link]
    c.  Never invent URLs

7.  Formatting requirements:
    a.  Use plain text only (no markdown/HTML)
    b.  Separate sections with clear headings
    c.  Use consistent date formats (YYYY-MM)
    d.  Maximum 700 words total

8.  Content rules:
    a.  Never include placeholders
    b.  Never omit Contact Information
    c.  Never create fictional experiences

Original CV:
{{{cv}}}

Job Description:
{{{jobDescription}}}

Content for 'adaptedCv' field:`,
});

const adaptCvFlow = ai.defineFlow(
  {
    name: 'adaptCvFlow',
    inputSchema: AdaptCvInputSchema,
    outputSchema: AdaptCvOutputSchema,
  },
  async input => {
    const {output} = await adaptCvPrompt(input);
    
    // Post-processing validation
    const result = output!;
    
    // 1. Check for placeholders
    const placeholderRegex = /\[[^\]]+\]/;
    if (placeholderRegex.test(result.adaptedCv)) {
      throw new Error("Placeholder detected in adapted CV");
    }
    
    // 2. Validate word count
    const wordCount = result.adaptedCv.split(/\s+/).length;
    if (wordCount > 700) {
      throw new Error(`CV exceeds 700-word limit (${wordCount} words)`);
    }
    
    // 3. Validate required sections
    const requiredSections = ["Contact Information", "Work Experience", "Skills"];
    const missingSections = requiredSections.filter(
      section => !result.adaptedCv.includes(section)
    );
    
    if (missingSections.length > 0) {
      throw new Error(`Missing required sections: ${missingSections.join(", ")}`);
    }
    
    return result;
  }
);
