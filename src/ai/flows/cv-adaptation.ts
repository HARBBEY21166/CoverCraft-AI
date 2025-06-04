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
  adaptedCv: z.string().describe('The adapted CV tailored to the job description.'),
});
export type AdaptCvOutput = z.infer<typeof AdaptCvOutputSchema>;

export async function adaptCv(input: AdaptCvInput): Promise<AdaptCvOutput> {
  return adaptCvFlow(input);
}

const adaptCvPrompt = ai.definePrompt({
  name: 'adaptCvPrompt',
  input: {schema: AdaptCvInputSchema},
  output: {schema: AdaptCvOutputSchema},
  prompt: `You are an expert resume writer. Your goal is to tailor a CV to a specific job description, highlighting the most relevant skills and experience.

  Original CV:
  {{cv}}

  Job Description:
  {{jobDescription}}

  Adapted CV:`, // The response should contain the full adapted CV. Focus on making every word count.
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
