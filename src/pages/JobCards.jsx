import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";
import { JOB_CARDS } from "../data/jobCards";
import JobCard from "../components/JobCard";
import JobCardMaker, { cardToForm } from "../components/JobCardMaker";

// Printable student job cards. Print CSS hides the app shell and prints only
// the selected cards, two per page, each with blanks for team and date.
// Teachers can add their own cards (custom_job_cards, supabase_job_cards_2026-10.sql),
// copy a built-in one to edit, or print a blank write-in card.
const PRINT_CSS = `
@media print {
  @page { margin: 0.5in; }
  body * { visibility: hidden !important; }
  #job-cards, #job-cards * { visibility: visible !important; }
  #job-cards { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
  #job-cards .job-card { box-shadow: none !important; }
  #job-cards > .job-card-wrap { break-inside: avoid; page-break-inside: avoid; margin-bottom: 0.35in; }
  #job-cards > .job-card-wrap:nth-of-type(2n) { break-after: page; page-break-after: always; }
  #job-cards .no-print { display: none !important; }
}`;

const BLANK = { id: "blank", icon: "📝", title: "Blank write-in card", blank: true };
const missingTable = (e) => e?.code === "42P01" || e?.code === "PGRST205" || /custom_job_cards|does not exist|could not find the table/i.test(e?.message || "");

export default function JobCards() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mine, setMine] = useState([]);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [picked, setPicked] = useState(() => new Set(JOB_CARDS.map((c) => c.id)));
  const [maker, setMaker] = useState(null); // null, or { initial, editingId }

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from("custom_job_cards").select("*").eq("user_id", user.id).order("created_at");
    if (error) { setSetupNeeded(missingTable(error)); return; }
    setMine((data || []).map((c) => ({ ...c, id: `mine:${c.id}`, dbId: c.id, mine: true })));
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  const all = [...JOB_CARDS, ...mine, BLANK];
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const chosen = all.filter((c) => picked.has(c.id));

  function openMaker(initial = null, editingId = null) {
    setMaker({ initial, editingId });
    requestAnimationFrame(() => document.getElementById("card-maker")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function save(row) {
    const { data, error } = maker.editingId
      ? await supabase.from("custom_job_cards").update({ ...row, updated_at: new Date().toISOString() }).eq("id", maker.editingId).select().single()
      : await supabase.from("custom_job_cards").insert({ ...row, user_id: user.id }).select().single();
    if (error) {
      return showToast({ title: "Couldn't save the card", description: missingTable(error) ? "Job cards aren't set up yet. A Growing Minds admin needs to run supabase_job_cards_2026-10.sql." : error.message, type: "error" });
    }
    showToast({ title: maker.editingId ? "Card updated" : `${row.icon} ${row.title} saved`, type: "success" });
    setMaker(null);
    await load();
    setPicked((p) => new Set([...p, `mine:${data.id}`]));
  }

  async function remove(c) {
    if (!window.confirm(`Delete your card "${c.title}"?`)) return;
    const { error } = await supabase.from("custom_job_cards").delete().eq("id", c.dbId);
    if (error) return showToast({ title: "Couldn't delete", description: error.message, type: "error" });
    setPicked((p) => { const n = new Set(p); n.delete(c.id); return n; });
    load();
  }

  const chip = (c) => (
    <label key={c.id} className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-sm font-semibold cursor-pointer min-h-[40px]
      ${picked.has(c.id) ? "border-teal-700 bg-teal-50 text-teal-900" : "border-gray-200 text-gray-600"}`}>
      <input type="checkbox" className="accent-teal-700" checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
      <span aria-hidden="true">{c.icon}</span> {c.title}
    </label>
  );

  return (
    <div className="space-y-6 pb-24">
      <style>{PRINT_CSS}</style>
      <div className="space-y-3">
        <Link to="/learn" className="text-xs font-semibold text-teal-800 underline">← All guides</Link>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="w-10 h-10 bg-teal-100 text-teal-700 rounded-3xl lg:rounded-2xl flex items-center justify-center shadow">🖨️</div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-teal-800">Student job cards</h1>
            <p className="text-xs text-gray-600 mt-0.5">Kid-friendly task cards for your tower teams. Print, laminate, and rotate them weekly.</p>
          </div>
        </div>
      </div>

      <fieldset className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <legend className="text-sm font-bold text-gray-800 px-1">Cards to print</legend>
        <div className="flex flex-wrap gap-2">{JOB_CARDS.map(chip)}</div>
        {mine.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-600 mb-1">My cards</p>
            <div className="flex flex-wrap gap-2">{mine.map(chip)}</div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">{chip(BLANK)}</div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" onClick={() => window.print()} disabled={chosen.length === 0}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl px-5 py-3 disabled:opacity-40">
            🖨️ Print {chosen.length} card{chosen.length === 1 ? "" : "s"}
          </button>
          {!maker && !setupNeeded && (
            <button type="button" onClick={() => openMaker()} className="border-2 border-teal-700 text-teal-800 font-semibold rounded-xl px-4 py-2.5 hover:bg-teal-50">
              ✏️ Make your own card
            </button>
          )}
        </div>
        {setupNeeded && (
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2" role="status">
            Making your own cards isn't set up yet. A Growing Minds admin needs to run <code>supabase_job_cards_2026-10.sql</code>. The blank write-in card works now.
          </p>
        )}
      </fieldset>

      {maker && (
        <JobCardMaker key={maker.editingId || JSON.stringify(maker.initial)} initial={maker.initial} editing={Boolean(maker.editingId)}
          onSave={save} onCancel={() => setMaker(null)} />
      )}

      <div id="job-cards" className="grid gap-4 md:grid-cols-2">
        {chosen.map((c) => (
          <div key={c.id} className="job-card-wrap space-y-1">
            <JobCard card={c} blank={c.blank} />
            {!c.blank && !setupNeeded && (
              <div className="no-print flex gap-3 px-2 text-xs">
                {c.mine ? (
                  <>
                    <button type="button" onClick={() => openMaker(cardToForm(c), c.dbId)} className="font-semibold text-teal-800 underline">✏️ Edit</button>
                    <button type="button" onClick={() => remove(c)} className="text-red-700 underline">Delete</button>
                  </>
                ) : (
                  <button type="button" onClick={() => openMaker(cardToForm(c, { copy: true }))} className="font-semibold text-teal-800 underline">📄 Copy and edit</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
