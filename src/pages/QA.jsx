import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";

export default function QA() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { showToast } = useToast();

  const [questions, setQuestions] = useState([]);
  const [showAsk, setShowAsk] = useState(false);
  const [title, setTitle] = useState("");

  /* Load questions */
  async function loadQuestions() {
    const { data } = await supabase
      .from("questions")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    setQuestions(data || []);
  }

  /* Ask question */
  async function askQuestion(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const { error } = await supabase.from("questions").insert({
      user_id: user.id,
      title,
    });

    if (error) {
      showToast({ title: "Could not post question", type: "error" });
    } else {
      setTitle("");
      setShowAsk(false);
      loadQuestions();
    }
  }

  useEffect(() => {
    loadQuestions();

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
        () => {
          console.log("🔥 New question detected!");
          loadQuestions();
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
            aria-label="Submit question"
            className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 
                       rounded-xl shadow-lg text-xs lg:text-base"
          >
            Submit Question
          </Button>
        </form>
      )}

      {/* Questions List */}
      <div className="space-y-4">
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
      </div>
    </div>
  );
}

/* ----------------------------------
   QUESTION CARD COMPONENT
-----------------------------------*/
function QuestionCard({ question, user, isAdmin, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [newAnswer, setNewAnswer] = useState("");
  const { showToast } = useToast();

  async function loadAnswers() {
    const { data } = await supabase
      .from("answers")
      .select("*, profiles(email)")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true });

    setAnswers(data || []);
  }

  async function deleteQuestion() {
    if (!confirm("Delete this question?")) return;

    const { data, error, count } = await supabase
  .from("questions")
  .delete({ count: "exact" })
  .eq("id", question.id);

console.log("DELETE RESULT:", { data, error, count });


    if (!error) {
      onDelete();
      showToast({ title: "Question deleted", type: "success" });
    } else {
      showToast({ title: "Error deleting question", type: "error" });
    }
  }

  async function deleteAnswer(id) {
    await supabase.from("answers").delete().eq("id", id);
    loadAnswers();
  }

  async function submitAnswer(e) {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    await supabase.from("answers").insert({
      question_id: question.id,
      user_id: user.id,
      content: newAnswer,
    });

    setNewAnswer("");
    loadAnswers();
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
        () => {
          console.log("🔥 New answer detected!");
          loadAnswers();
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

        {/* ADMIN DELETE */}
        {isAdmin && (
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
        <span>{question.profiles?.email?.split("@")[0]}</span>
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
              aria-label={`Answer by ${a.profiles?.email}`}
            >
              <p className="text-sm lg:text-base text-gray-700">{a.content}</p>

              <p className="text-[10px] lg:text-xs text-teal-700 font-bold uppercase mt-1">
                — {a.profiles?.email?.split("@")[0]}
              </p>

              {isAdmin && (
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
              aria-label="Submit answer"
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
