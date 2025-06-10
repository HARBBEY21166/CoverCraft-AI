
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
  coverLetter: z.string().describe('The complete text of the generated cover letter. This string should start directly with the letter content (e.g., "Dear Hiring Manager,...") and should not include any introductory labels like "Cover Letter:". It must also not contain any placeholder text for information like portfolio links; if such information is not available in the adapted CV, it should be omitted from the cover letter.'),
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
  The response for the 'coverLetter' field should be the full text of the letter itself.

  Important: When writing the cover letter, if you choose to mention a portfolio or personal website, you must only include a link if a full, valid, and complete URL for it is explicitly present in the 'Adapted CV' text. Do not invent URLs or use any form of placeholder text for links (e.g., '[Your Portfolio Link]', '[available at ... placeholder ...]', etc.). If a specific, complete link is not found in the adapted CV, then do not reference a portfolio link in the cover letter.

  Adapted CV:
  {{{adaptedCv}}}

  Job Description:
  {{{jobDescription}}}

  Content for 'coverLetter' field:`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    let coverLetter = output!.coverLetter;

    const links = [
      "Portfolio: https://abbeyscript.netlify.app",
      "GitHub: https://github.com/HARBBEY21166",
      "LinkedIn: https://www.linkedin.com/in/abbey0/",
    ];

    // Check if links are already present before adding
    const linksToAdd = links.filter(link => !coverLetter.includes(link.split(': ')[1]));

    if (linksToAdd.length > 0) {
      // Find a suitable place to add links, preferably near contact info or at the end
      // A simple approach is to append them to the end if they are not found.
      // A more sophisticated approach could attempt to insert them into a "Contact Information" section.

      // Append links at the end, separated by newlines
      coverLetter += "\n\n" + linksToAdd.join("\n");
    }

    return {
      coverLetter: coverLetter
    };
  }
);

