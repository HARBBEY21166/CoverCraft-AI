'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating cover letters based on a CV and job description.
 *
 * - generateCoverLetter - A function that generates a cover letter.
 * - CoverLetterInput - The input type for the generateCoverLetter function.
 * - CoverLetterOutput - The return type for the generateCoverLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoverLetterInputSchema = z.object({
  adaptedCv: z.string().describe('The adapted CV tailored to the job description.'),
  jobDescription: z.string().describe('The job description for the target position.'),
});
export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;

const CoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter.'),
});
export type CoverLetterOutput = z.infer<typeof CoverLetterOutputSchema>;

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coverLetterPrompt',
  input: {schema: CoverLetterInputSchema},
  output: {schema: CoverLetterOutputSchema},
  prompt: `You are an expert career coach specializing in writing professional cover letters.

  Based on the provided adapted CV and job description, write a compelling cover letter.
  The cover letter should be tailored to highlight the most relevant skills and experience from the CV that align with the job description.

  Adapted CV: {{{adaptedCv}}}
  Job Description: {{{jobDescription}}}

  Cover Letter:`, // Removed the handlebars expression that outputs the cover letter
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
