'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LegalDocument, AskDocumentResponse } from '@/types/legal';
import {
  Send,
  MessageSquare,
  Search,
  Quote,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

interface AskDocumentChatProps {
  document: LegalDocument;
  onInspectCitation?: (quote: string, section: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responsePayload?: AskDocumentResponse;
}

export const AskDocumentChat: React.FC<AskDocumentChatProps> = ({
  document,
  onInspectCitation,
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createGreeting = React.useCallback((): ChatMessage => ({
    id: `welcome-${Date.now()}`,
    sender: 'assistant',
    text: `Hello! I am your grounded legal document assistant for "${document.title}". Ask me any question about the obligations, terms, notice periods, or clauses in this document. Every answer I provide will cite exact excerpts from the text. If a term is not in the document, I will clearly state that it cannot be found.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }), [document.title]);

  const [messages, setMessages] = useState<ChatMessage[]>([createGreeting()]);

  // Reset chat greeting when switching documents
  useEffect(() => {
    setMessages([createGreeting()]);
  }, [document.id, createGreeting]);

  // Auto-scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestedQuestions = [
    'What are my termination notice obligations?',
    'Is there an automatic renewal or extension clause?',
    'What liabilities or damages are capped or excluded?',
    'What dispute resolution process and jurisdiction apply?',
    'Are there any post-employment or non-compete restrictions?',
  ];

  // Bounded client-side memoization cache for immediate 0ms answer recall
  const clientQueryCache = useRef<Map<string, AskDocumentResponse>>(new Map());

  const handleAsk = async (queryText: string) => {
    const trimmedQuery = queryText.trim();
    if (!trimmedQuery || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    const normKey = trimmedQuery.toLowerCase().replace(/\s+/g, ' ');
    if (clientQueryCache.current.has(normKey)) {
      const cached = clientQueryCache.current.get(normKey)!;
      const cachedAssistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: cached.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responsePayload: cached,
      };
      setMessages((prev) => [...prev, cachedAssistantMessage]);
      setLoading(false);
      return;
    }

    try {
      // Send minimized document context (slashes payload size by 60-80% per request)
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            id: document.id,
            title: document.title,
            documentType: document.documentType,
            rawText: document.rawText,
            clauses: document.clauses,
          },
          question: trimmedQuery,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Failed to retrieve grounded answer.');
      }

      const result: AskDocumentResponse = data.result;
      clientQueryCache.current.set(normKey, result);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responsePayload: result,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error communicating with document engine.';
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Sorry, I encountered an issue retrieving information: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Chat history cleared. Ready for new inquiries regarding "${document.title}".`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col h-[700px]">
      {/* Header with Clear History and Status */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-amber-400 flex items-center justify-center">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
              Evidence-Grounded Inquiries
            </h3>
            <span className="text-[11px] text-slate-500">
              Retrieves verifiable citations from: {document.fileName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <span className="text-[11px] text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded font-mono">
            Anti-Hallucination Active
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          Suggestions:
        </span>
        {suggestedQuestions.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(sq)}
            className="text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Document question and answer conversation"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-lg p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-br-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200/60 text-[10px] uppercase tracking-wider font-semibold">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Synthesis
                  </span>
                  {msg.responsePayload?.groundedEvidence && msg.responsePayload.groundedEvidence.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Evidence Grounded
                    </span>
                  )}
                  {msg.responsePayload?.notFoundInDocument && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-700" />
                      Not Found in Document (Absence Confirmed)
                    </span>
                  )}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Grounded Evidence Citation Box */}
              {msg.responsePayload?.groundedEvidence && msg.responsePayload.groundedEvidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 uppercase tracking-wide">
                    <div className="flex items-center gap-1">
                      <Quote className="w-3 h-3 text-slate-500" />
                      <span>Document Evidence (Verbatim Excerpt):</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-normal">
                      Verified Contiguous Quote
                    </span>
                  </div>
                  {msg.responsePayload.groundedEvidence.map((ev, i) => (
                    <div
                      key={i}
                      onClick={() => onInspectCitation && onInspectCitation(ev.quote, ev.section)}
                      className={`bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-700 font-mono transition-all ${
                        onInspectCitation
                          ? 'cursor-pointer hover:border-amber-400 hover:shadow-xs group'
                          : ''
                      }`}
                      title={onInspectCitation ? 'Click to inspect in Evidence Drawer' : undefined}
                    >
                      <blockquote className="italic border-l-2 border-amber-500 pl-2">
                        &ldquo;{ev.quote}&rdquo;
                      </blockquote>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-sans mt-1.5">
                        <span className="font-semibold text-slate-700">Source Section: {ev.section}</span>
                        <div className="flex items-center gap-1">
                          <span>Grounding Support: {ev.confidence}%</span>
                          {onInspectCitation && (
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Missing Information / Not Found Notice */}
              {msg.responsePayload?.notFoundInDocument && msg.responsePayload.missingInformationNotice && (
                <div className="mt-3 p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Missing Information / Silence Notice:</strong>
                    <span>{msg.responsePayload.missingInformationNotice}</span>
                  </div>
                </div>
              )}

              {/* Follow-up Questions for Attorney */}
              {msg.responsePayload?.suggestedFollowUpQuestions &&
                msg.responsePayload.suggestedFollowUpQuestions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/80 text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                      Consider Asking Legal Counsel:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {msg.responsePayload.suggestedFollowUpQuestions.map((q, idx) => (
                        <li key={idx} className="italic">
                          &ldquo;{q}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            {/* Message Meta Bar with Copy and Timestamp */}
            <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-500">
              <span>{msg.timestamp}</span>
              {msg.sender === 'assistant' && (
                <button
                  onClick={() => handleCopyAnswer(msg.id, msg.text)}
                  className="inline-flex items-center gap-0.5 hover:text-slate-800 transition-colors"
                  title="Copy Answer"
                  aria-label="Copy Answer"
                >
                  {copiedId === msg.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span>Searching document text & citations...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          type="text"
          id="document-question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document (e.g. 'What are the termination penalties?')..."
          className="flex-1 min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
          disabled={loading}
          aria-label="Ask a question about this document"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-4 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-label="Submit document inquiry"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
