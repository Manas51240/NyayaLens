'use client';

import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';

interface AskDocumentChatProps {
  document: LegalDocument;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responsePayload?: AskDocumentResponse;
}

export const AskDocumentChat: React.FC<AskDocumentChatProps> = ({ document }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your grounded legal document assistant for "${document.title}". Ask me any question about the obligations, terms, notice periods, or clauses in this document. Every answer I provide will cite exact excerpts from the text. If a term is not in the document, I will clearly state that it cannot be found.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const suggestedQuestions = [
    'What are my termination notice obligations?',
    'Is there an automatic renewal or extension clause?',
    'What liabilities or damages are capped or excluded?',
    'What dispute resolution process and jurisdiction apply?',
    'Are there any post-employment or non-compete restrictions?',
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          question: queryText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.result) {
        throw new Error(data.error || 'Failed to retrieve grounded answer.');
      }

      const result: AskDocumentResponse = data.result;

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

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col h-[700px]">
      {/* Header */}
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
        <span className="text-[11px] text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded font-mono">
          Anti-Hallucination Active
        </span>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Grounded Evidence Citation Box */}
              {msg.responsePayload?.groundedEvidence && msg.responsePayload.groundedEvidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    <Quote className="w-3 h-3 text-slate-500" />
                    <span>Retrieved Document Evidence:</span>
                  </div>
                  {msg.responsePayload.groundedEvidence.map((ev, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded p-2.5 text-xs text-slate-700 font-mono">
                      <blockquote className="italic border-l-2 border-amber-500 pl-2">
                        "{ev.quote}"
                      </blockquote>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans mt-1.5">
                        <span>Source: {ev.section}</span>
                        <span>Confidence: {ev.confidence}%</span>
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
                    <strong className="block font-semibold">Absence Notice:</strong>
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
                          "{q}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-xs">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span>Searching document text & citations...</span>
          </div>
        )}
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
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document (e.g. 'What are the termination penalties?')..."
          className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
          disabled={loading}
          aria-label="Ask a question about this document"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
