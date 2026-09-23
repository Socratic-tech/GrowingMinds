import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../supabase/client";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import { Skeleton } from "../components/ui/Skeleton";

const FORM_KEYS = [
  "title", "driving_question", "plants_used", "variable", "what_to_measure",
  "prediction", "observation_checkpoint", "conclusion", "teacher_note",
];

function formFromItem(item) {
  return Object.fromEntries(FORM_KEYS.map((k) => [k, item?.[k] || ""]));
}

function sameForm(a, b) {
  return FORM_KEYS.every((k) => (a[k] || "") === (b[k] || ""));
}

const EMPTY_FORM = {
  title:                  "",
  driving_question:       "",
  plants_used:            "",
  variable:               "",
  what_to_measure:        "",
  prediction:             "",
  observation_checkpoint: "",
  conclusion:             "",
  teacher_note:           "",
};

/* ─── Main component ─────────────────────────────────────── */
export default function LessonLab() {
  const { user }     = useAuth();
  const { showToast } = useToast();

  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);   // investigation id
  const [editing,  setEditing]  = useState(null);   // id | "new" | null
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [baseline, setBaseline] = useState(EMPTY_FORM); // form values when editing began
  const formRef = useRef(null);

  const isDirty = editing !== null && !sameForm(form, baseline);

  function confirmDiscard() {
    return !isDirty || confirm("You have unsaved changes. Discard them?");
  }

  function openForm(id, values) {
    setForm(values);
    setBaseline(values);
    setEditing(id);
    setExpanded(null);
  }

  function closeForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setBaseline(EMPTY_FORM);
  }

  // Scroll the form into view whenever a new edit session starts.
  useEffect(() => {
    if (editing !== null) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editing, baseline]);

  /* ── Load ────────────────────────────────────────────────── */
  const loadItems = useCallback(async () => {
    const { data, error } = await supabase
      .from("investigations")
      .select("*")
      .or(`is_template.eq.true,user_id.eq.${user.id}`)
      .order("is_template", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      showToast({ title: "Failed to load investigations", description: error.message, type: "error" });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [showToast, user.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  /* ── Save (create or update) ─────────────────────────────── */
  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast({ title: "Title is required", type: "error" });
      return;
    }
    setSaving(true);

    if (editing === "new") {
      const { error } = await supabase.from("investigations").insert({
        ...formFromItem(form),
        user_id: user.id,
        is_template: false,
      });
      if (error) {
        showToast({ title: "Failed to create investigation", description: error.message, type: "error" });
      } else {
        showToast({ title: "Investigation created!", type: "success" });
        closeForm();
        loadItems();
      }
    } else {
      // Update own investigation only
      const { data, error } = await supabase
        .from("investigations")
        .update(formFromItem(form))
        .eq("id", editing)
        .eq("user_id", user.id)
        .select();
      if (error || !data || data.length === 0) {
        showToast({
          title: "Failed to update investigation",
          description: error?.message || "You can only edit investigations you created.",
          type: "error",
        });
      } else {
        showToast({ title: "Investigation updated!", type: "success" });
        closeForm();
        loadItems();
      }
    }
    setSaving(false);
  }

  /* ── Delete ──────────────────────────────────────────────── */
  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    const { data, error } = await supabase
      .from("investigations")
      .delete()
      .eq("id", item.id)
      .eq("user_id", user.id)
      .select();
    if (error || !data || data.length === 0) {
      showToast({
        title: "Failed to delete",
        description: error?.message || "You can only delete investigations you created.",
        type: "error",
      });
    } else {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      if (editing === item.id) closeForm();
      showToast({ title: "Investigation deleted", type: "success" });
    }
  }

  /* ── Edit existing ───────────────────────────────────────── */
  function startEdit(item) {
    if (editing === item.id) return;
    if (!confirmDiscard()) return;
    openForm(item.id, formFromItem(item));
  }

  /* ── New (blank) ─────────────────────────────────────────── */
  function startNew() {
    if (!confirmDiscard()) return;
    openForm("new", EMPTY_FORM);
  }

  /* ── Use a template: prefilled new investigation owned by the user ── */
  function startFromTemplate(item) {
    if (!confirmDiscard()) return;
    openForm("new", { ...formFromItem(item), title: `${item.title} (my version)` });
  }

  /* ── Separate templates from custom ─────────────────────── */
  const templates = items.filter((i) => i.is_template);
  const custom    = items.filter((i) => !i.is_template && i.user_id === user.id);

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="w-10 h-10 bg-teal-100 text-teal-700
                       rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
          >
            🔬
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
              Lesson Lab
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              STEM investigations for your Gardyn classroom
            </p>
          </div>
        </div>

        {editing !== "new" && (
          <button
            onClick={startNew}
            aria-label="Create new investigation"
            className="bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl
                       text-xs lg:text-sm font-semibold shadow-md min-h-[44px]
                       focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            + New
          </button>
        )}
      </div>

      {loading ? (
        <LessonLabSkeleton />
      ) : (
        <>
          {/* ── Create / Edit form ─────────────────────────── */}
          {editing !== null && (
            <div ref={formRef} className="scroll-mt-4">
              <InvestigationForm
                form={form}
                isNew={editing === "new"}
                saving={saving}
                onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
                onSave={handleSave}
                onCancel={closeForm}
              />
            </div>
          )}

          {/* ── Starter Templates ──────────────────────────── */}
          <section aria-label="Starter investigations">
            <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3">
              🌱 Starter Investigations ({templates.length})
            </h2>
            <div className="space-y-3">
              {templates.map((item) => (
                <InvestigationCard
                  key={item.id}
                  item={item}
                  isExpanded={expanded === item.id}
                  onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                  canEdit={false}
                  onUseTemplate={() => startFromTemplate(item)}
                />
              ))}
            </div>
          </section>

          {/* ── Custom investigations ─────────────────────── */}
          <section aria-label="Your investigations">
            <h2 className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-3">
              ✏️ Your Investigations ({custom.length})
            </h2>

            {custom.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-3xl mb-2" aria-hidden="true">🧪</p>
                <p className="text-sm font-semibold text-gray-700">Your class's first investigation is waiting!</p>
                <p className="text-xs mt-1">
                  Tap "Use this template" on a starter above to make it your own,
                  or hit "+ New" to design one from scratch.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {custom.map((item) => (
                  <InvestigationCard
                    key={item.id}
                    item={item}
                    isExpanded={expanded === item.id}
                    onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
                    canEdit={!item.is_template && item.user_id === user.id}
                    onEdit={() => startEdit(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ─── Investigation Card ─────────────────────────────────── */
function InvestigationCard({ item, isExpanded, onToggle, canEdit, onEdit, onDelete, onUseTemplate }) {
  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden
                  transition-shadow hover:shadow-md
                  ${isExpanded ? "border-teal-300" : "border-gray-200"}`}
      role="region"
      aria-label={item.title}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="flex-1 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-700 rounded"
        >
          <p className="font-semibold text-gray-900 text-sm lg:text-base">
            {item.title}
          </p>
          {item.driving_question && (
            <p className="text-xs text-gray-500 italic mt-0.5 line-clamp-1">
              {item.driving_question}
            </p>
          )}
        </button>

        {/* Badges + actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {item.is_template && (
            <span className="text-[10px] font-bold uppercase tracking-wider
                             bg-teal-50 text-teal-600 border border-teal-200
                             px-2 py-0.5 rounded-full">
              Template
            </span>
          )}
          {item.is_template && onUseTemplate && (
            <button
              onClick={onUseTemplate}
              aria-label={`Use ${item.title} as a template for a new investigation`}
              className="px-2 py-1 rounded-xl text-[11px] font-semibold text-teal-700
                         border border-teal-200 hover:bg-teal-50
                         focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              Use this template
            </button>
          )}
          {canEdit && (
            <>
              <button
                onClick={onEdit}
                aria-label={`Edit ${item.title}`}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                           text-gray-400 hover:text-teal-600 hover:bg-teal-50
                           focus-visible:ring-2 focus-visible:ring-teal-700 text-sm"
              >
                ✏️
              </button>
              <button
                onClick={onDelete}
                aria-label={`Delete ${item.title}`}
                className="w-8 h-8 flex items-center justify-center rounded-xl
                           text-gray-400 hover:text-red-600 hover:bg-red-50
                           focus-visible:ring-2 focus-visible:ring-red-500 text-sm"
              >
                🗑️
              </button>
            </>
          )}
          <button
            onClick={onToggle}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className="w-8 h-8 flex items-center justify-center rounded-xl
                       text-gray-400 hover:text-gray-600
                       focus-visible:ring-2 focus-visible:ring-teal-700 text-xs"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {[
            { label: "Plants",        value: item.plants_used,            icon: "🌱" },
            { label: "Variable",      value: item.variable,               icon: "⚗️" },
            { label: "What to Measure", value: item.what_to_measure,     icon: "📏" },
            { label: "Checkpoints",   value: item.observation_checkpoint, icon: "📅" },
            { label: "Teacher Note",  value: item.teacher_note,          icon: "💡" },
          ].filter((row) => row.value).map((row) => (
            <div key={row.label} className="flex gap-2 text-sm">
              <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{row.icon}</span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {row.label}
                </span>
                <p className="text-gray-700 text-xs lg:text-sm">{row.value}</p>
              </div>
            </div>
          ))}

          {/* Student fields */}
          {(item.prediction || item.conclusion) && (
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">
                Student Work
              </p>
              {item.prediction && (
                <FieldBlock label="Prediction / Hypothesis" value={item.prediction} />
              )}
              {item.conclusion && (
                <FieldBlock label="Conclusion / Evidence" value={item.conclusion} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FieldBlock({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className="text-xs lg:text-sm text-gray-700">{value}</p>
    </div>
  );
}

/* ─── Investigation Form ─────────────────────────────────── */
function InvestigationForm({ form, isNew, saving, onChange, onSave, onCancel }) {
  const FIELDS = [
    { key: "title",                  label: "Title *",                    placeholder: "e.g. Growth Rate Race",      required: true  },
    { key: "driving_question",       label: "Driving Question",            placeholder: "What question will students investigate?",  required: false },
    { key: "plants_used",            label: "Plants",                      placeholder: "e.g. Arugula / Basil",       required: false },
    { key: "variable",               label: "Variable",                    placeholder: "What is being changed/tested?", required: false },
    { key: "what_to_measure",        label: "What Students Will Measure",  placeholder: "Height, color, count…",     required: false },
    { key: "observation_checkpoint", label: "Observation Checkpoints",     placeholder: "e.g. Week 1 + Week 2",      required: false },
    { key: "prediction",             label: "Student Prediction",          placeholder: "Leave blank for students to fill in", required: false },
    { key: "conclusion",             label: "Student Conclusion",          placeholder: "Leave blank for students to fill in", required: false },
    { key: "teacher_note",           label: "Teacher Note",                placeholder: "Tips, connections, warnings…", required: false },
  ];

  return (
    <form
      onSubmit={onSave}
      className="bg-white border border-teal-200 rounded-3xl lg:rounded-2xl
                 p-6 shadow-md space-y-4 animate-fadeIn"
      aria-label={isNew ? "New investigation" : "Edit investigation"}
    >
      <h2 className="font-bold text-teal-800 text-base">
        {isNew ? "New Investigation" : "Edit Investigation"}
      </h2>

      {FIELDS.map(({ key, label, placeholder, required }) => (
        <div key={key}>
          <label htmlFor={`inv-${key}`} className="block text-xs font-semibold text-gray-600 mb-1">
            {label}
          </label>
          {key === "prediction" || key === "conclusion" || key === "teacher_note" ? (
            <textarea
              id={`inv-${key}`}
              rows={2}
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => onChange(key, e.target.value)}
              required={required}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm
                         shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700 resize-none"
            />
          ) : (
            <input
              id={`inv-${key}`}
              type="text"
              placeholder={placeholder}
              value={form[key]}
              onChange={(e) => onChange(key, e.target.value)}
              required={required}
              className="w-full p-3 border border-gray-300 rounded-xl text-sm
                         shadow-inner focus-visible:ring-2 focus-visible:ring-teal-700"
            />
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl
                     font-semibold text-sm disabled:opacity-50 transition-colors
                     focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          {saving ? "Saving…" : isNew ? "Create Investigation" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl
                     hover:bg-gray-50 text-sm focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ─── Loading skeleton ───────────────────────────────────── */
function LessonLabSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading investigations…" aria-busy="true">
      {[1,2,3,4,5,6].map((i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  );
}
