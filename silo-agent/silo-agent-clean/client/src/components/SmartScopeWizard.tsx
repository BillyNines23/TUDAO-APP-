import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import ProgressTracker from "./ProgressTracker";
import logoUrl from "@assets/generated_images/TUDAO_logo_professional_blue_badge_d6d08bf6.png";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DynamicQuestion } from "@shared/schema";

interface SmartScopeWizardProps {
  sessionId: string;
  onComplete: () => void;
}

export default function SmartScopeWizard({ 
  sessionId, 
  onComplete
}: SmartScopeWizardProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const [questionCount, setQuestionCount] = useState(0);

  const { data: currentQuestion, isLoading } = useQuery<DynamicQuestion | { completed: true }>({
    queryKey: ['/api/scope-sessions', sessionId, 'questions', 'next'],
    refetchOnMount: true,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const res = await apiRequest('POST', `/api/scope-sessions/${sessionId}/answers`, { questionId, answer });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/scope-sessions', sessionId, 'questions', 'next'] 
      });
      setTextAnswer("");
      setQuestionCount(prev => prev + 1);
    },
  });

  useEffect(() => {
    if (currentQuestion && 'completed' in currentQuestion && currentQuestion.completed) {
      onComplete();
    }
  }, [currentQuestion, onComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium text-muted-foreground">
            Loading question...
          </span>
        </div>
      </div>
    );
  }

  if (!currentQuestion || 'completed' in currentQuestion) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium text-muted-foreground">
            Generating your scope...
          </span>
        </div>
      </div>
    );
  }

  const question = currentQuestion as DynamicQuestion;
  const options = question.options ? (question.options as string[]) : [];
  const isMultipleChoice = question.questionType === "multiple_choice" && options.length > 0;
  // Treat everything else as text input (including "text" and "photo_upload")
  const isTextInput = !isMultipleChoice;

  const handleSelectOption = (option: string) => {
    submitAnswerMutation.mutate({
      questionId: question.id,
      answer: option
    });
  };

  const handleSubmitText = () => {
    if (textAnswer.trim()) {
      submitAnswerMutation.mutate({
        questionId: question.id,
        answer: textAnswer
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="TUDAO"
            className="h-12 w-12"
            data-testid="img-logo-small"
          />
        </div>

        <ProgressTracker currentStep={3 + questionCount} totalSteps={8} />

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-primary uppercase tracking-wide">
              AI-Powered Scope Generation
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              {question.questionText}
            </h2>
            {/* Consultant Guidance - Primary helper copy */}
            {(question as any).guidance && (
              <p className="text-base text-foreground/80 mt-3 leading-relaxed px-4">
                {(question as any).guidance}
              </p>
            )}
            {/* Technical Rationale - Secondary detail (only if guidance also exists) */}
            {question.aiRationale && (question as any).guidance && (
              <p className="text-sm text-muted-foreground mt-2">
                {question.aiRationale}
              </p>
            )}
            {/* Fallback: Elevate rationale to guidance styling if no guidance exists */}
            {question.aiRationale && !(question as any).guidance && (
              <p className="text-base text-foreground/80 mt-3 leading-relaxed px-4">
                {question.aiRationale}
              </p>
            )}
          </div>

          {isMultipleChoice && (
            <div className="grid gap-3 md:grid-cols-3">
              {options.map((option) => (
                <Card
                  key={option}
                  className="cursor-pointer p-4 text-center font-medium hover-elevate active-elevate-2 transition-all"
                  onClick={() => handleSelectOption(option)}
                  data-testid={`option-${option.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {option}
                </Card>
              ))}
            </div>
          )}

          {isTextInput && (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Type your answer..."
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={submitAnswerMutation.isPending}
                className="text-base"
                data-testid="input-text-answer"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textAnswer.trim()) {
                    handleSubmitText();
                  }
                }}
              />
              <Button
                size="lg"
                className="w-full"
                onClick={handleSubmitText}
                disabled={!textAnswer.trim() || submitAnswerMutation.isPending}
                data-testid="button-submit-answer"
              >
                {submitAnswerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          )}

          {submitAnswerMutation.isPending && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Generating next question...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
