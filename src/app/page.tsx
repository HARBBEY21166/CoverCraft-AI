
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import jsPDF from "jspdf";

// ShadCN UI
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// Lucide Icons
import { Sparkles, Download, Loader2, FileText, Briefcase, ClipboardCopy, ExternalLink, Eraser } from "lucide-react";

// AI functions
import { adaptCv, type AdaptCvInput, type AdaptCvOutput } from "@/ai/flows/cv-adaptation";
import { generateCoverLetter, type CoverLetterInput, type CoverLetterOutput } from "@/ai/flows/cover-letter-generation";

// Form schema
const formSchema = z.object({
  originalCv: z.string().min(50, { message: "CV must be at least 50 characters long." }).max(10000, { message: "CV must be at most 10000 characters long."}),
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters long." }).max(10000, { message: "Job description must be at most 10000 characters long."}),
});
type FormData = z.infer<typeof formSchema>;

export default function CoverCraftPage() {
  const [adaptedCvText, setAdaptedCvText] = useState<string>("");
  const [coverLetterText, setCoverLetterText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originalCv: "",
      jobDescription: "",
    },
  });

  const handleGenerate: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAdaptedCvText("");
    setCoverLetterText("");

    try {
      const adaptCvPayload: AdaptCvInput = {
        cv: data.originalCv,
        jobDescription: data.jobDescription,
      };
      const adaptedCvResponse: AdaptCvOutput = await adaptCv(adaptCvPayload);
      
      if (!adaptedCvResponse || !adaptedCvResponse.adaptedCv) {
        throw new Error("AI failed to adapt CV. Please try again.");
      }
      setAdaptedCvText(adaptedCvResponse.adaptedCv);

      const generateCoverLetterPayload: CoverLetterInput = {
        adaptedCv: adaptedCvResponse.adaptedCv,
        jobDescription: data.jobDescription,
      };
      const coverLetterResponse: CoverLetterOutput = await generateCoverLetter(generateCoverLetterPayload);
      
      if (!coverLetterResponse || !coverLetterResponse.coverLetter) {
        throw new Error("AI failed to generate cover letter. Please try again.");
      }
      setCoverLetterText(coverLetterResponse.coverLetter);

      toast({
        title: "Success!",
        description: "CV and Cover Letter generated successfully.",
      });

    } catch (e: any) {
      console.error("Error generating content:", e);
      const errorMessage = e.message || "An unexpected error occurred. Please check your inputs or try again later.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdfFile = (content: string, filename: string) => {
    if (typeof window === "undefined") return;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const margin = 15; // mm
    const maxLineWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFontSize(12);

    const lines = doc.splitTextToSize(content, maxLineWidth);

    lines.forEach((line: string) => {
      if (y + 10 > pageHeight - margin) { 
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 7; 
    });
    
    doc.save(filename);
    toast({ title: "Downloaded", description: `${filename} has been downloaded.` });
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (typeof window === "undefined" || !navigator.clipboard) {
      toast({ title: "Error", description: "Clipboard API not available.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${label} has been copied.` });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Error", description: `Failed to copy ${label}.`, variant: "destructive" });
    }
  };

  const handleClearInputs = () => {
    form.reset({ originalCv: "", jobDescription: "" });
    setAdaptedCvText("");
    setCoverLetterText("");
    setError(null);
    toast({
      title: "Inputs Cleared",
      description: "The form and generated content have been cleared.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex flex-col">
      <header className="py-6 md:py-8 px-4 md:px-8 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">CoverCraft AI</h1>
          <p className="text-md md:text-lg mt-1 opacity-90">
            Tailor your CV and generate compelling cover letters with the power of AI.
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex-grow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerate)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-xl rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl font-headline flex items-center text-primary">
                    <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Your CV
                  </CardTitle>
                  <CardDescription>Paste your current CV in plain text format.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="originalCv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Original CV</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your plain text CV here..."
                            className="min-h-[200px] md:min-h-[250px] text-sm bg-card focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-xl rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl md:text-2xl font-headline flex items-center text-primary">
                    <Briefcase className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Target Job Description
                  </CardTitle>
                  <CardDescription>Paste the job description for the position you're applying for.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the job description here..."
                            className="min-h-[200px] md:min-h-[250px] text-sm bg-card focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {error && !isLoading && (
              <Alert variant="destructive" className="shadow-md rounded-lg">
                <AlertTitle>Generation Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto min-w-[260px] text-base shadow-lg rounded-md transition-all hover:shadow-xl active:scale-95">
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Crafting Your Documents..." : "Generate Tailored Documents"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={handleClearInputs} disabled={isLoading} className="w-full sm:w-auto min-w-[200px] text-base shadow-lg rounded-md transition-all hover:shadow-xl active:scale-95">
                <Eraser className="mr-2 h-5 w-5" />
                Clear Inputs
              </Button>
            </div>
          </form>
        </Form>

        {(adaptedCvText || coverLetterText) && !isLoading && (
          <div className="mt-10 md:mt-16 space-y-8">
            <h2 className="text-2xl md:text-3xl font-headline font-semibold text-center text-primary mb-6">Your Generated Documents</h2>
            {adaptedCvText && (
              <Card className="shadow-xl rounded-lg">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-xl md:text-2xl font-headline flex items-center text-accent">
                      <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Adapted CV
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(adaptedCvText, "Adapted CV")} className="rounded-md">
                        <ClipboardCopy className="mr-1.5 h-4 w-4" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" asChild className="rounded-md">
                        <a href="https://resume-architect-eight.vercel.app/" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-4 w-4" /> Open Resume Architect
                        </a>
                      </Button>
                    </div>
                  </div>
                  <CardDescription>Your CV tailored to the job description.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={adaptedCvText}
                    readOnly
                    className="min-h-[250px] md:min-h-[350px] text-sm bg-muted/50 border-muted-foreground/20 rounded-md"
                  />
                </CardContent>
              </Card>
            )}

            {coverLetterText && (
              <Card className="shadow-xl rounded-lg">
                <CardHeader>
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <CardTitle className="text-xl md:text-2xl font-headline flex items-center text-accent">
                      <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Generated Cover Letter
                    </CardTitle>
                     <div className="flex space-x-2">
                       <Button variant="outline" size="sm" onClick={() => copyToClipboard(coverLetterText, "Cover Letter")} className="rounded-md">
                         <ClipboardCopy className="mr-1.5 h-4 w-4" /> Copy
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => downloadPdfFile(coverLetterText, "cover_letter.pdf")} className="rounded-md">
                         <Download className="mr-1.5 h-4 w-4" /> Download PDF
                       </Button>
                     </div>
                   </div>
                  <CardDescription>A cover letter generated based on your adapted CV and job description.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={coverLetterText}
                    readOnly
                    className="min-h-[250px] md:min-h-[350px] text-sm bg-muted/50 border-muted-foreground/20 rounded-md"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      
      <footer className="text-center py-6 md:py-8 mt-10 md:mt-16 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CoverCraft AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
