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

  async function loadQuestions() {
    const { data } = await supabase
      .from("questions")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    setQuestions(data || []);
  }

  async function askQuestion(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await supabase.from("questions").insert({
      user_id: user.id,
      title,
    });

    setTitle("");
    setShowAsk(false);
    loadQuestions();
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center shadow-sm">
            ❓
          </div>
          <h2 className="text-xl font-bold text-teal-800">Q & A</h2>
        </div>

        <Button
          onClick={() => setShowAsk(!showAsk)}
          className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 py-2 shadow-md text-xs font-bold"
        >
          {showAsk ? "Cancel" : "Ask Question"}
        </Button>
      </div>

      {/* Ask Question */}
      {showAsk && (
        <form
          onSubmit={askQuestion}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md space-y-4 animate-fadeIn"
        >
          <textarea
            placeholder="What is your question?"
            className="w-full p-4 rounded-xl border border-gray-300 shadow-inner text-sm h-24"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl shadow-lg text-xs font-bold uppercase tracking-wide">
            Submit Question
          </Button>
        </form>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            user={user}
            isAdmin={isAdmin}
            onDelete={() =>
              setQuestions((prev) => prev.filter((item) => item.id !== q.id))
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------
   QUESTION CARD
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

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", question.id);

    if (error) {
      showToast({ title: "Failed to delete question", type: "error" });
    } else {
      onDelete(); // 🔥 immediately update UI
      showToast({ title: "Question deleted", type: "success" });
    }
  }

  async function deleteAnswer(id) {
    const { error } = await supabase
      .from("answers")
      .delete()
      .eq("id", id);

    if (!error) loadAnswers();
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

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">

      {/* Header */}
      <div className="flex items-start p-5 gap-4">

        {/* Title + expand */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => {
            setExpanded(!expanded);
            if (!expanded) loadAnswers();
          }}
        >
          <p className="font-semibold text-gray-800 text-sm">
            {question.title}
          </p>
        </div>

        {/* ADMIN DELETE */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteQuestion();
            }}
            className="text-red-500 hover:text-red-700 text-sm px-2"
          >
            🗑️
          </button>
        )}

        {/* Expand */}
        <span
          className="text-gray-400 text-sm cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
            if (!expanded) loadAnswers();
          }}
        >
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Metadata */}
      <div className="px-5 pb-2 text-xs flex items-center gap-2 text-gray-500">
        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-md uppercase font-bold tracking-wide text-[10px]">
          Question
        </span>
        <span>{question.profiles?.email?.split("@")[0]}</span>
      </div>

      {/* Answers */}
      {expanded && (
        <div className="bg-gray-50 p-5 border-t border-gray-200 space-y-4">

          {/* No answers */}
          {answers.length === 0 && (
            <p className="text-xs text-gray-400 italic">No answers yet</p>
          )}

          {/* Answer list */}
          {answers.map((a) => (
            <div
              key={a.id}
              className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative"
            >
              <p className="text-sm text-gray-700">{a.content}</p>

              <p className="text-[10px] text-teal-700 font-bold uppercase mt-1">
                — {a.profiles?.email?.split("@")[0]}
              </p>

              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnswer(a.id);
                  }}
                  className="absolute top-2 right-3 text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Add Answer */}
          <form onSubmit={submitAnswer} className="flex gap-2">
            <input
              className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm shadow-inner focus:ring-2 focus:ring-teal-700"
              placeholder="Write an answer…"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
            <Button className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl">
              Send
            </Button>
          </form>

        </div>
      )}
    </div>
  );
}
