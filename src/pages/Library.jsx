import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";
import { LibrarySkeleton } from "../components/ui/Skeleton";

/**
 * Normalize a user-entered resource URL. Adds https:// when no scheme is
 * given; returns null for anything that isn't a valid http(s) URL
 * (javascript:, data:, mailto:, garbage...).
 */
function normalizeUrl(raw) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  // Has an explicit scheme like "javascript:" / "http:" (but not "host:port")?
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[^/:]+:\d+(\/|$)/.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return u.href;
  } catch {
    return null;
  }
}

/** Only allow http(s) hrefs when rendering stored resources. */
function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export default function Library() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { showToast } = useToast();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("Guide");
  const [submitting, setSubmitting] = useState(false);

  async function loadResources() {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        showToast({ title: "Failed to load resources", description: error.message, type: "error" });
      } else {
        setResources(data || []);
      }
    } catch (err) {
      showToast({ title: "Error loading resources", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
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

    if (submitting || !title.trim() || !url.trim()) return;

    const normalized = normalizeUrl(url);
    if (!normalized) {
      showToast({
        title: "Invalid link",
        description: "Enter a web address starting with http:// or https://",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("resources")
        .insert({ title: title.trim(), url: normalized, category })
        .select()
        .single();

      if (error) {
        showToast({ title: "Failed to add resource", description: error.message, type: "error" });
      } else {
        setTitle("");
        setUrl("");
        setCategory("Guide");
        setShowAdd(false);
        if (data) {
          setResources((prev) => (prev.some((r) => r.id === data.id) ? prev : [data, ...prev]));
        }
        showToast({ title: "Resource added", type: "success" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteResource(id) {
    if (!confirm("Delete this resource?")) return;
    const { data, error } = await supabase.from("resources").delete().eq("id", id).select();
    if (error) {
      showToast({ title: "Failed to delete resource", description: error.message, type: "error" });
    } else if (!data || data.length === 0) {
      showToast({ title: "Couldn't delete — you may not have permission", type: "error" });
    } else {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="w-10 h-10 bg-teal-100 text-teal-700 
                       rounded-3xl lg:rounded-2xl flex items-center justify-center shadow"
          >
            📚
          </div>

          <h1 className="text-xl lg:text-3xl font-bold text-teal-800">
            Library
          </h1>
        </div>

        {isAdmin && (
          <Button
            aria-label={showAdd ? "Cancel add resource form" : "Add new resource"}
            className="bg-teal-700 hover:bg-teal-800 text-white 
                       px-4 py-2 rounded-xl lg:rounded-lg shadow-md 
                       text-xs lg:text-sm min-h-[44px]"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? "Cancel" : "Add"}
          </Button>
        )}
      </div>

      {/* ADD RESOURCE FORM */}
      {showAdd && (
        <form
          onSubmit={addResource}
          aria-labelledby="add-resource-title"
          className="bg-white p-6 rounded-3xl lg:rounded-2xl border border-gray-200 
                     shadow-md space-y-4 animate-fadeIn"
        >
          <label id="add-resource-title" className="sr-only">
            Add a new resource
          </label>

          <label htmlFor="resource-title" className="sr-only">
            Resource Title
          </label>
          <input
            id="resource-title"
            type="text"
            placeholder="Title"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl lg:rounded-lg 
                       shadow-inner text-sm lg:text-base focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="resource-url" className="sr-only">
            Resource URL
          </label>
          <input
            id="resource-url"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="https://example.org/guide"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl lg:rounded-lg 
                       shadow-inner text-sm lg:text-base focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <label htmlFor="resource-category" className="sr-only">
            Resource Category
          </label>
          <select
            id="resource-category"
            className="w-full p-3 lg:p-4 border border-gray-300 rounded-xl lg:rounded-lg
                       text-sm lg:text-base bg-white shadow-inner focus-visible:ring-2 
                       focus-visible:ring-teal-700"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>Guide</option>
            <option>Curriculum</option>
            <option>Video</option>
          </select>

          <Button
            type="submit"
            aria-label="Submit new resource"
            disabled={submitting}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white 
                       py-3 lg:py-4 rounded-xl shadow-lg text-xs lg:text-base"
          >
            {submitting ? "Adding…" : "Add Resource"}
          </Button>
        </form>
      )}

      {/* RESOURCE LIST */}
      {loading ? (
        <LibrarySkeleton />
      ) : null}

      <div className="space-y-4 pb-24">
        {!loading && resources.length === 0 && (
          <div className="bg-white p-8 rounded-3xl lg:rounded-2xl border border-gray-200
                          shadow-md text-center text-gray-500 text-sm lg:text-base">
            <p className="text-3xl mb-2" aria-hidden="true">📚</p>
            {isAdmin
              ? "The library is empty — use Add to share the first resource."
              : "No resources yet. Your program admins will add guides, curriculum, and videos here soon."}
          </div>
        )}

        {!loading && resources.map((r) => {
          const href = safeHref(r.url);
          const inner = (
            <>
              <div
                aria-hidden="true"
                className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl 
                           flex items-center justify-center shadow"
              >
                🔗
              </div>

              <div className="flex flex-col">
                <p className="font-semibold text-gray-800 text-sm lg:text-base">
                  {r.title}
                </p>

                <span className="text-[10px] lg:text-xs uppercase font-bold text-teal-700">
                  {r.category}
                </span>
              </div>
            </>
          );
          return (
          <div
            key={r.id}
            className="bg-white p-5 rounded-3xl lg:rounded-2xl border border-gray-200 
                       shadow-md flex justify-between items-center"
            role="group"
            aria-label={`Resource titled ${r.title}`}
          >
            {/* Resource Link (only http/https URLs are rendered as links) */}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open resource: ${r.title}`}
                className="flex items-center gap-4 flex-1 hover:underline 
                           focus-visible:ring-2 focus-visible:ring-teal-700 rounded-lg"
              >
                {inner}
              </a>
            ) : (
              <div
                className="flex items-center gap-4 flex-1 opacity-60"
                title="This link is invalid"
              >
                {inner}
              </div>
            )}

            {/* DELETE BUTTON */}
            {isAdmin && (
              <button
                aria-label={`Delete resource titled ${r.title}`}
                onClick={() => deleteResource(r.id)}
                className="
                  w-10 h-10 flex items-center justify-center rounded-xl 
                  text-red-400 hover:text-red-600 text-base 
                  focus-visible:ring-2 focus-visible:ring-red-500 ml-2
                "
              >
                🗑️
              </button>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}
