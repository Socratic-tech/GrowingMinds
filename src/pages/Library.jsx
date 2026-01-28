import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";

export default function Library() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { showToast } = useToast();

  const [resources, setResources] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Guide");

  async function loadResources() {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    setResources(data || []);
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function addResource(e) {
    e.preventDefault();

    if (!isAdmin) {
      showToast({ title: "Only admins can add resources", type: "error" });
      return;
    }

    if (!title.trim() || !url.trim()) return;

    const { error } = await supabase
      .from("resources")
      .insert({ title, url, category });

    if (error) {
      showToast({ title: "Failed to add resource", type: "error" });
    } else {
      setTitle("");
      setUrl("");
      setCategory("Guide");
      setShowAdd(false);
      loadResources();
    }
  }

  async function deleteResource(id) {
    if (!confirm("Delete this resource?")) return;
    await supabase.from("resources").delete().eq("id", id);
    loadResources();
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center shadow">
            📚
          </div>
          <h2 className="text-xl font-bold text-teal-800">Library</h2>
        </div>

        {isAdmin && (
          <Button
            className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 py-2 shadow-md"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? "Cancel" : "Add"}
          </Button>
        )}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <form
          onSubmit={addResource}
          className="bg-white p-6 rounded-3xl border border-gray-200 shadow-md space-y-4 animate-fadeIn"
        >
          <input
            type="text"
            placeholder="Title"
            className="w-full p-3 border border-gray-300 rounded-xl shadow-inner text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="text"
            placeholder="URL"
            className="w-full p-3 border border-gray-300 rounded-xl shadow-inner text-sm"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <select
            className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white shadow-inner"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Guide</option>
            <option>Curriculum</option>
            <option>Video</option>
          </select>

          <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-xl shadow-lg text-xs font-bold uppercase">
            Add Resource
          </Button>
        </form>
      )}

      {/* RESOURCE LIST */}
      <div className="space-y-4 pb-24">
        {resources.map((r) => (
          <div
            key={r.id}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-md flex justify-between items-center"
          >
            <a
              href={r.url}
              target="_blank"
              className="flex items-center gap-4 flex-1 hover:underline"
            >
              <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center shadow">
                🔗
              </div>

              <div className="flex flex-col">
                <p className="font-semibold text-gray-800 text-sm">{r.title}</p>
                <span className="text-[10px] uppercase font-bold text-teal-700">
                  {r.category}
                </span>
              </div>
            </a>

            {isAdmin && (
              <button
                onClick={() => deleteResource(r.id)}
                className="text-red-400 hover:text-red-600 text-sm px-2"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
