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
  adaptedCv: z.string().describe('The adapted CV tailored to the job description. This should be concise, featuring a maximum of 3 most relevant work experiences, each with a maximum of 3 bullet points. It should not contain any placeholder text.'),
});
export type AdaptCvOutput = z.infer<typeof AdaptCvOutputSchema>;

export async function adaptCv(input: AdaptCvInput): Promise<AdaptCvOutput> {
  return adaptCvFlow(input);
}

const adaptCvPrompt = ai.definePrompt({
  name: 'adaptCvPrompt',
  input: {schema: AdaptCvInputSchema},
  output: {schema: AdaptCvOutputSchema},
  prompt: `You are an expert resume writer. Your task is to adapt the Original CV to the provided Job Description.

Follow these critical instructions for the "adaptedCv" output:
1.  Identify the most relevant skills and experiences from the Original CV that match the Job Description.
2.  Select a maximum of the three (3) most relevant work experiences from the Original CV to include. If there are more than three, prioritize those that best align with the Job Description.
3.  For each selected work experience, write a maximum of three (3) concise and impactful bullet points. These bullet points should highlight achievements and responsibilities that directly relate to the requirements in the Job Description.
4.  The entire "adaptedCv" output must be the complete, ready-to-use CV content. Do not include any placeholders, introductory labels (like "Adapted CV:"), or instructional text. Focus on making every word count.

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
