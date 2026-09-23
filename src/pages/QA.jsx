import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { QASkeleton } from "../components/ui/Skeleton";
import { displayName } from "../utils/displayName";

const PAGE_SIZE = 30;

const NO_PERMISSION = "Couldn't delete — you may not have permission";

export default function QA() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { showToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  function addQuestionLocally(row) {
    setQuestions((prev) => (prev.some((q) => q.id === row.id) ? prev : [row, ...prev]));
  }

  /* Load questions (paged) */
  async function loadQuestions(pageNum = 0) {
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        showToast({ title: "Failed to load questions", description: error.message, type: "error" });
      } else {
        const rows = data || [];
        setQuestions((prev) => {
          if (pageNum === 0) return rows;
          const seen = new Set(prev.map((q) => q.id));
          return [...prev, ...rows.filter((q) => !seen.has(q.id))];
        });
        setPage(pageNum + 1);
        setHasMore(rows.length === PAGE_SIZE);
      }
    } catch (err) {
      showToast({ title: "Error loading questions", description: err.message, type: "error" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  /* Ask question */
  async function askQuestion(e) {
    e.preventDefault();
    if (submitting || !title.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          user_id: user.id,
          title,
        })
        .select("*, profiles(*)")
        .single();

      if (error) {
        showToast({ title: "Could not post question", description: error.message, type: "error" });
      } else {
        setTitle("");
        setShowAsk(false);
        if (data) addQuestionLocally(data);
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadQuestions(0);

    // Subscribe to new questions for live updates
    const channel = supabase
      .channel('questions-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'questions'
        },
        async (payload) => {
          const { data } = await supabase
            .from("questions")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single();
          if (data) addQuestionLocally(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div aria-hidden="true"
            className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl 
                       flex items-center justify-center shadow-sm">
            ❓
          </div>

          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Q & A</h1>
        </div>

        <Button
          aria-label={showAsk ? "Cancel question form" : "Open question form"}
          onClick={() => setShowAsk(!showAsk)}
          className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 
                     rounded-xl lg:rounded-lg shadow-md text-xs lg:text-sm 
                     min-h-[44px]"
        >
          {showAsk ? "Cancel" : "Ask Question"}
        </Button>
      </div>

      {/* Ask Question Form */}
      {showAsk && (
        <form
          onSubmit={askQuestion}
          className="bg-white p-6 rounded-3xl lg:rounded-2xl border border-gray-200 
                     shadow-md space-y-4 animate-fadeIn"
          aria-labelledby="ask-question-title"
        >
          <label id="ask-question-title" htmlFor="question-input" className="sr-only">
            Ask your question
          </label>

          <textarea
            id="question-input"
            className="w-full p-4 rounded-xl border border-gray-300 shadow-inner 
                       text-sm lg:text-base h-24 focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            placeholder="What is your question?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Button
            type="submit"
            aria-label="Submit question"
            disabled={submitting || !title.trim()}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 
                       rounded-xl shadow-lg text-xs lg:text-base"
          >
            {submitting ? "Submitting…" : "Submit Question"}
          </Button>
        </form>
      )}

      {/* Questions List */}
      {loading ? (
        <QASkeleton />
      ) : (
      <div className="space-y-4 pb-24">
        {questions.length === 0 && (
          <div className="bg-white p-8 rounded-3xl lg:rounded-2xl border border-gray-200
                          shadow-md text-center text-gray-500 text-sm lg:text-base">
            <p className="text-3xl mb-2" aria-hidden="true">💬</p>
            No questions yet — ask the first one!
          </div>
        )}

        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            user={user}
            isAdmin={isAdmin}
            onDelete={() =>
              setQuestions((prev) => prev.filter((x) => x.id !== q.id))
            }
          />
        ))}

        {hasMore && questions.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => loadQuestions(page)}
              disabled={loadingMore}
              className="bg-white border border-teal-700 text-teal-700 hover:bg-teal-50
                         px-8 py-3 rounded-xl shadow font-semibold text-sm lg:text-base
                         disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more questions"}
            </Button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

/* ----------------------------------
   QUESTION CARD COMPONENT
-----------------------------------*/
function QuestionCard({ question, user, isAdmin, onDelete }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const author = displayName(question.profiles);
  const canDeleteQuestion = isAdmin || question.user_id === user?.id;

  function addAnswerLocally(row) {
    setAnswers((prev) => (prev.some((a) => a.id === row.id) ? prev : [...prev, row]));
  }

  async function loadAnswers() {
    const { data, error } = await supabase
      .from("answers")
      .select("*, profiles(*)")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true });

    if (error) {
      showToast({ title: "Failed to load answers", description: error.message, type: "error" });
    } else {
      setAnswers(data || []);
    }
  }

  async function deleteQuestion() {
    if (!confirm("Delete this question?")) return;

    const { data, error } = await supabase
      .from("questions")
      .delete()
      .eq("id", question.id)
      .select();

    if (error) {
      showToast({ title: "Error deleting question", description: error.message, type: "error" });
    } else if (!data || data.length === 0) {
      showToast({ title: NO_PERMISSION, type: "error" });
    } else {
      onDelete();
      showToast({ title: "Question deleted", type: "success" });
    }
  }

  async function deleteAnswer(id) {
    if (!confirm("Delete this answer?")) return;
    const { data, error } = await supabase.from("answers").delete().eq("id", id).select();
    if (error) {
      showToast({ title: "Failed to delete answer", description: error.message, type: "error" });
    } else if (!data || data.length === 0) {
      showToast({ title: NO_PERMISSION, type: "error" });
    } else {
      setAnswers((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function submitAnswer(e) {
    e.preventDefault();
    if (submitting || !newAnswer.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("answers")
        .insert({
          question_id: question.id,
          user_id: user.id,
          content: newAnswer,
        })
        .select("*, profiles(*)")
        .single();

      if (error) {
        showToast({ title: "Failed to post answer", description: error.message, type: "error" });
        return;
      }

      setNewAnswer("");
      if (data) addAnswerLocally(data);
    } finally {
      setSubmitting(false);
    }
  }

  // Subscribe to new answers when question is expanded
  useEffect(() => {
    if (!expanded) return;

    const channel = supabase
      .channel(`answers-${question.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`
        },
        async (payload) => {
          const { data } = await supabase
            .from("answers")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single();
          if (data) addAnswerLocally(data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expanded, question.id]);

  return (
    <div
      className="bg-white rounded-3xl lg:rounded-2xl border border-gray-200 
                 shadow-md overflow-hidden"
      role="region"
      aria-labelledby={`question-${question.id}`}
    >

      {/* Header / Summary Row */}
      <div className="flex items-start p-5 gap-4">

        <div
          id={`question-${question.id}`}
          className="flex-1 cursor-pointer"
          onClick={() => {
            setExpanded(!expanded);
            if (!expanded) loadAnswers();
          }}
        >
          <h2 className="font-semibold text-gray-800 text-sm lg:text-base">
            {question.title}
          </h2>
        </div>

        {/* DELETE (owner or admin) */}
        {canDeleteQuestion && (
          <button
            aria-label="Delete question"
            onClick={(e) => {
              e.stopPropagation();
              deleteQuestion();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-xl 
                       text-red-500 hover:text-red-700 text-lg 
                       focus-visible:ring-2 focus-visible:ring-red-500"
          >
            🗑️
          </button>
        )}

        {/* EXPAND COLLAPSE BUTTON */}
        <button
          aria-expanded={expanded}
          aria-controls={`answers-${question.id}`}
          aria-label={expanded ? "Collapse answers" : "Expand answers"}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
            if (!expanded) loadAnswers();
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl 
                     text-gray-400 hover:text-gray-600 
                     focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Meta Row */}
      <div className="px-5 pb-2 text-xs lg:text-sm flex items-center gap-2 text-gray-500">
        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md 
                         uppercase font-bold text-[10px] lg:text-xs">
          Question
        </span>
        <button
          onClick={() => navigate(`/profile/${question.user_id}`)}
          className="hover:underline focus-visible:underline text-left"
        >
          {author}
        </button>
      </div>

      {/* Answer Section */}
      {expanded && (
        <div
          id={`answers-${question.id}`}
          className="bg-gray-50 p-5 border-t border-gray-200 space-y-4"
        >
          {/* NO ANSWERS */}
          {answers.length === 0 && (
            <p className="text-xs lg:text-sm text-gray-400 italic">
              No answers yet
            </p>
          )}

          {/* ANSWER LIST */}
          {answers.map((a) => (
            <div
              key={a.id}
              className="bg-white p-3 rounded-3xl lg:rounded-2xl 
                         border border-gray-200 shadow-sm relative"
              role="group"
              aria-label={`Answer by ${displayName(a.profiles)}`}
            >
              <p className="text-sm lg:text-base text-gray-700">{a.content}</p>

              <p className="text-[10px] lg:text-xs text-teal-700 font-bold uppercase mt-1">
                — {displayName(a.profiles)}
              </p>

              {(isAdmin || a.user_id === user?.id) && (
                <button
                  aria-label="Delete answer"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnswer(a.id);
                  }}
                  className="absolute top-2 right-3 w-8 h-8 flex items-center 
                             justify-center rounded-xl text-red-400 hover:text-red-600 
                             text-xs focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* ADD ANSWER FORM */}
          <form onSubmit={submitAnswer} className="flex gap-2">
            <label htmlFor={`answer-input-${question.id}`} className="sr-only">
              Your answer
            </label>

            <input
              id={`answer-input-${question.id}`}
              className="flex-1 bg-white border border-gray-300 rounded-xl lg:rounded-lg 
                         px-4 py-2 text-sm lg:text-base shadow-inner 
                         focus-visible:ring-2 focus-visible:ring-teal-700"
              placeholder="Write an answer…"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />

            <Button
              type="submit"
              aria-label="Submit answer"
              disabled={submitting || !newAnswer.trim()}
              className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 
                         w-12 h-12 flex items-center justify-center text-lg"
            >
              ➤
            </Button>
          </form>

        </div>
      )}

    </div>
  );
}
