
// src/ai/flows/cv-adaptation.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for adapting a CV to a specific job description.
 *
 * - adaptCv - A function that takes a CV and job description as input and returns an adapted CV.
 * - AdaptCvInput - The input type for the adaptCv function.
 * - AdaptCvOutput - The return type for the adaptCv function.
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
  prompt: `You are an expert resume writer. Your task is to adapt the Original CV to the provided Job Description, creating a complete and tailored resume.

Follow these critical instructions for the "adaptedCv" output:
1.  The "adaptedCv" should be a complete and professional resume. Adapt all sections found in the Original CV to align with the Job Description. Do not omit sections from the Original CV unless their content becomes entirely irrelevant after attempting adaptation to the Job Description.
2.  If a "Summary/Objective" section is present in the Original CV:
    a.  Ensure it is strongly aligned with the target job role outlined in the Job Description.
    b.  It should highlight no more than one primary job role or professional focus.
3.  If a "Skills" section is present in the Original CV:
    a.  Identify and list skills from the Original CV that are most relevant to the Job Description.
    b.  Ensure this section is clearly aligned with the requirements and keywords found in the Job Description.
4.  If a "Work Experience" section is present in the Original CV:
    a.  Identify the most relevant skills and experiences from the Original CV that match the Job Description.
    b.  Select a maximum of the three (3) most relevant work experiences from the Original CV to include. If there are more than three, prioritize those that best align with the Job Description.
    c.  For each selected work experience, write a maximum of three (3) concise and impactful bullet points. These bullet points should highlight achievements and responsibilities that directly relate to the requirements in the Job Description.
5.  For all other sections found in the Original CV (e.g., Contact Information, Education, Projects, Certifications, etc.), adapt their content to be relevant and concise for the target job.
6.  Ensure all information in the "adaptedCv" is concise and impactful, directly supporting the application for the target job.
7.  The entire "adaptedCv" output must be the complete, ready-to-use CV content. Do not include any placeholders, introductory labels (like "Adapted CV:"), or instructional text.

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
    return output!;
  }
);

