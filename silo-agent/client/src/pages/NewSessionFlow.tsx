/**
 * New Session-Based Flow
 * Works with the new /api/session/* endpoints
 */

import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Send, CheckCircle2, Settings, Camera, X, Lightbulb } from "lucide-react";
import heic2any from "heic2any";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Question {
  id: string;
  text: string;
  responseType: string;
  options?: string[];
}

interface RegionalInfo {
  multiplier: number;
  label: string;
  adjustmentPercent: number;
  appliesTo: string;
}

interface ScopePreview {
  category: string;
  subcategory: string;
  details: Record<string, any>;
  estimated_hours: number;
  materials_needed: string[];
  complexity: string;
  vendor_type: string;
  add_on_fees?: Array<{name: string; amount: number}>;
  total_add_on_fees?: number;
  hourly_rate?: number;
  estimated_labor_cost?: number;
  estimated_material_cost?: number;
  estimated_total_cost?: number;
  regional_info?: RegionalInfo;
  material_calculation?: string;
}

export default function NewSessionFlow() {
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [scopePreview, setScopePreview] = useState<ScopePreview | null>(null);
  const [finalScope, setFinalScope] = useState<any | null>(null);
  const [progress, setProgress] = useState({ requiredAnswered: 0, requiredTotal: 0 });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  /**
   * Convert HEIC/HEIF files to JPEG on the client side
   * This prevents 413 errors by reducing file size before upload
   */
  const convertHeicToJpeg = async (file: File): Promise<File> => {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.heic') && !fileName.endsWith('.heif')) {
      return file; // Not a HEIC file, return as-is
    }

    try {
      console.log(`[HEIC Conversion] Converting ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.8
      });

      // heic2any can return Blob or Blob[], handle both cases
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      const newFile = new File(
        [blob], 
        file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
        { type: "image/jpeg" }
      );
      
      console.log(`[HEIC Conversion] ✅ Converted to JPEG: ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
      return newFile;
    } catch (error) {
      console.error(`[HEIC Conversion] ❌ Failed to convert ${file.name}:`, error);
      return file; // Return original if conversion fails
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setSelectedPhotos(prev => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const startSession = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    addMessage("user", inputValue);
    const userMessage = inputValue;
    setInputValue("");

    try {
      // If photos are uploaded, use FormData for multipart upload
      if (selectedPhotos.length > 0) {
        const formData = new FormData();
        formData.append("initial_message", userMessage);
        
        // Convert HEIC files to JPEG before uploading
        console.log(`[Upload] Converting ${selectedPhotos.length} photos...`);
        const convertedPhotos = await Promise.all(
          selectedPhotos.map(photo => convertHeicToJpeg(photo))
        );
        
        convertedPhotos.forEach((photo) => {
          formData.append("photos", photo);
        });
        console.log(`[Upload] All photos converted and ready to upload`);

        const response = await fetch("/api/session/start", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to start session");

        const data = await response.json();
        setSessionId(data.session_id);
        setSelectedPhotos([]); // Clear photos after upload
        
        if (data.question) {
          setCurrentQuestion(data.question);
          addMessage("assistant", data.question.text);
        }
      } else {
        // No photos, use JSON
        const response = await fetch("/api/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initial_message: userMessage }),
        });

        if (!response.ok) throw new Error("Failed to start session");

        const data = await response.json();
        setSessionId(data.session_id);
        
        if (data.question) {
          setCurrentQuestion(data.question);
          addMessage("assistant", data.question.text);
        }
      }
    } catch (error) {
      console.error("Error starting session:", error);
      addMessage("assistant", "Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const answerQuestion = async () => {
    if (!sessionId || !currentQuestion) return;

    let answer = "";
    if (currentQuestion.responseType === "choice") {
      answer = selectedOption;
    } else if (currentQuestion.responseType === "multiple_choice") {
      answer = selectedOptions.join(", ");
    } else {
      answer = inputValue;
    }
    
    if (!answer.trim()) return;

    setLoading(true);
    addMessage("user", answer);
    setInputValue("");
    setSelectedOption("");
    setSelectedOptions([]);

    try {
      const response = await fetch("/api/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: currentQuestion.id,
          question_text: currentQuestion.text, // Send question text to store conversation history
          answer,
          phase: (currentQuestion as any).phase || null, // Include phase metadata if available
          phaseLabel: (currentQuestion as any).phaseLabel || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to answer question");

      const data = await response.json();
      
      console.log('[NewSessionFlow] Answer response:', {
        status: data.status,
        hasNextQuestion: !!data.next_question,
        nextQuestionText: data.next_question?.text,
        responseType: data.next_question?.responseType,
        progress: data.progress,
        aiAdvice: data.aiAdvice
      });

      if (data.status === "ready_to_finalize") {
        // Show scope preview
        setScopePreview(data.scope_preview);
        setCurrentQuestion(null);
        setAiAdvice(null);
        addMessage("assistant", "Great! I have enough information to create your scope. Here's what I've prepared:");
      } else if (data.next_question) {
        // Ask next question
        setCurrentQuestion(data.next_question);
        setProgress(data.progress);
        addMessage("assistant", data.next_question.text);
        
        // 🆕 Set AI advice in dedicated state (guaranteed to display)
        setAiAdvice(data.aiAdvice || null);
      }
    } catch (error) {
      console.error("Error answering question:", error);
      addMessage("assistant", "Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeScope = async () => {
    if (!sessionId) return;

    setLoading(true);

    try {
      const response = await fetch("/api/scope/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) throw new Error("Failed to complete scope");

      const data = await response.json();
      setFinalScope(data);
      addMessage("assistant", `✅ Scope completed! ${data.summary}`);
    } catch (error) {
      console.error("Error completing scope:", error);
      addMessage("assistant", "Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      startSession();
    } else {
      answerQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Header */}
        <div className="flex justify-end gap-2 mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/login")}
            data-testid="link-login"
          >
            Login
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/admin")}
            data-testid="link-admin"
          >
            <Settings className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>TUDAO Scope Agent</CardTitle>
            {progress.requiredTotal > 0 && (
              <p className="text-sm text-muted-foreground">
                Progress: {progress.requiredAnswered}/{progress.requiredTotal} required questions answered
              </p>
            )}
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Welcome! Tell me what service you need help with.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For example: "My kitchen faucet is dripping"
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}

              {/* AI Advice - Dedicated Component (Guaranteed to Display) */}
              {aiAdvice && !loading && !scopePreview && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" data-testid="ai-advice-card">
                  <CardContent className="pt-4 pb-3 px-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">AI Insight</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200" data-testid="ai-advice-text">{aiAdvice}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Scope Preview */}
              {scopePreview && !finalScope && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Scope Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>Service:</strong> {scopePreview.subcategory}</p>
                    <p><strong>Category:</strong> {scopePreview.category}</p>
                    <p><strong>Estimated Time:</strong> {scopePreview.estimated_hours} hours</p>
                    <p><strong>Complexity:</strong> {scopePreview.complexity}</p>
                    <p><strong>Materials:</strong> {scopePreview.materials_needed.join(", ")}</p>
                    <p><strong>Recommended:</strong> {scopePreview.vendor_type}</p>
                    
                    {/* Cost Estimate Section */}
                    {scopePreview.estimated_total_cost !== undefined && (
                      <div className="border-t pt-3 mt-3">
                        <p className="font-semibold mb-2 text-lg">Cost Estimate:</p>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Labor ({scopePreview.estimated_hours} hrs @ ${((scopePreview.hourly_rate || 0) / 100).toFixed(0)}/hr):</span>
                            <span data-testid="labor-cost">${((scopePreview.estimated_labor_cost || 0) / 100).toFixed(2)}</span>
                          </div>
                          
                          {/* Regional Adjustment */}
                          {scopePreview.regional_info && scopePreview.regional_info.adjustmentPercent !== 0 && (
                            <div className="flex justify-between text-xs text-muted-foreground pl-4">
                              <span>Regional adjustment ({scopePreview.regional_info.label}):</span>
                              <span data-testid="regional-adjustment">
                                {scopePreview.regional_info.adjustmentPercent > 0 ? '+' : ''}
                                {scopePreview.regional_info.adjustmentPercent}%
                              </span>
                            </div>
                          )}
                          
                          <div className="flex justify-between">
                            <span>Materials{scopePreview.material_calculation ? ` (${scopePreview.material_calculation})` : ''}:</span>
                            <span data-testid="material-cost">${((scopePreview.estimated_material_cost || 0) / 100).toFixed(2)}</span>
                          </div>
                          
                          {/* Add-on Fees */}
                          {scopePreview.add_on_fees && scopePreview.add_on_fees.length > 0 && (
                            <div className="border-t pt-2 mt-2">
                              {scopePreview.add_on_fees.map((fee: any, index: number) => (
                                <div key={index} className="flex justify-between" data-testid={`addon-fee-${index}`}>
                                  <span>• {fee.name}:</span>
                                  <span>${(fee.amount / 100).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                            <span>Estimated Total:</span>
                            <span data-testid="estimated-total">${((scopePreview.estimated_total_cost || 0) / 100).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          * This is a fair market estimate. Final pricing may vary based on vendor quotes. Vendors are responsible for including any applicable taxes in their quotes.
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={completeScope} 
                      className="w-full mt-4"
                      data-testid="button-complete-scope"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm & Complete Scope
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Final Scope - TUDAO Formatted Proposal */}
              {finalScope && (
                <div className="space-y-4">
                  {/* Success Message */}
                  <Card className="bg-green-50 dark:bg-green-950" data-testid="scope-completed-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Scope Completed!
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Scope ID: {finalScope.scope_id}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {finalScope.next}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {/* Formatted TUDAO Proposal */}
                  {finalScope.formatted_proposal && (
                    <Card data-testid="formatted-proposal-card">
                      <CardHeader>
                        <CardTitle className="text-base">Your Professional Proposal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="bg-muted p-4 rounded-md overflow-x-auto"
                          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                        >
                          <pre 
                            className="text-xs leading-relaxed whitespace-pre-wrap"
                            data-testid="formatted-proposal-text"
                          >
                            {finalScope.formatted_proposal}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            {!finalScope && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo Upload - Only show before session starts */}
                {!sessionId && (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-file-photos"
                    />

                    {selectedPhotos.length === 0 ? (
                      <Card 
                        className="border-2 border-dashed p-4 text-center cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-photos"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Camera className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Add Photos (Optional)</p>
                            <p className="text-xs text-muted-foreground">
                              Photos help AI generate better scopes
                            </p>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2">
                          {selectedPhotos.map((photo, index) => (
                            <div key={index} className="relative group" data-testid={`photo-preview-${index}`}>
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-20 object-cover rounded-md"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemovePhoto(index)}
                                data-testid={`button-remove-photo-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Card 
                            className="border-2 border-dashed h-20 flex items-center justify-center cursor-pointer hover-elevate active-elevate-2"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="button-add-more-photos"
                          >
                            <Camera className="h-5 w-5 text-muted-foreground" />
                          </Card>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion?.responseType === "multiple_choice" ? (
                  <div className="space-y-3" data-testid="checkbox-group-options" data-question-id={currentQuestion.id}>
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`checkbox-${index}`}
                          checked={selectedOptions.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOptions([...selectedOptions, option]);
                            } else {
                              setSelectedOptions(selectedOptions.filter(o => o !== option));
                            }
                          }}
                          data-testid={`checkbox-option-${index}`}
                        />
                        <Label htmlFor={`checkbox-${index}`} className="cursor-pointer">{option}</Label>
                      </div>
                    ))}
                  </div>
                ) : currentQuestion?.responseType === "choice" ? (
                  <RadioGroup 
                    value={selectedOption} 
                    onValueChange={setSelectedOption}
                    data-testid="radio-group-options"
                    data-question-id={currentQuestion.id}
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`option-${index}`}
                          data-testid={`radio-option-${index}`}
                        />
                        <Label htmlFor={`option-${index}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : currentQuestion ? (
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer..."
                    className="min-h-[100px]"
                    data-testid="textarea-input"
                    data-question-id={currentQuestion.id}
                  />
                ) : (
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe the service you need..."
                    className="min-h-[100px]"
                    data-testid="textarea-input"
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || (!inputValue.trim() && !selectedOption && selectedOptions.length === 0)}
                  data-testid="button-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {!sessionId ? "Start" : "Send"}
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
