import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "../supabase/client";
import { useAuth } from "../context/AuthProvider";
import { useToast } from "../components/ui/toast";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isOwnProfile = user?.id === userId;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);

    try {
      const [profileRes, postsRes, questionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("posts")
          .select("id, content, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("questions")
          .select("id, title, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (profileRes.error) {
        showToast({ title: "Couldn't load profile", description: profileRes.error.message, type: "error" });
      }

      if (profileRes.data) {
        setProfile(profileRes.data);
        setBio(profileRes.data.bio || "");
        setDraft(profileRes.data.bio || "");
      }

      setPosts(postsRes.data || []);
      setQuestions(questionsRes.data || []);
    } catch (err) {
      showToast({ title: "Error loading profile", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function saveBio() {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: draft })
      .eq("id", userId);

    if (error) {
      showToast({ title: "Failed to save bio", type: "error" });
    } else {
      setBio(draft);
      setEditing(false);
      showToast({ title: "Bio updated", type: "success" });
    }
    setSaving(false);
  }

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
        <span className="text-5xl">👤</span>
        <p className="text-sm">Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-teal-700 text-sm font-semibold hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const username = profile.email?.split("@")[0];
  const initial = profile.email?.charAt(0).toUpperCase();
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="space-y-6 pb-24">

      {/* PROFILE CARD */}
      <div className="bg-white rounded-3xl lg:rounded-2xl p-6 shadow-xl border border-gray-200 space-y-5">

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-700 text-white flex items-center
                          justify-center font-bold text-2xl flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-teal-800 truncate">{username}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700
                             rounded-full text-[10px] font-bold uppercase">
              {profile.role}
            </span>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          {editing ? (
            <>
              <textarea
                className="w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-700
                           shadow-inner focus-visible:ring-2 focus-visible:ring-teal-600
                           resize-none"
                rows={3}
                placeholder="Write a short bio…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveBio}
                  disabled={saving}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold
                             px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => { setDraft(bio); setEditing(false); }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold
                             px-4 py-2 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-500 leading-relaxed">
                {bio || (
                  <span className="italic">
                    {isOwnProfile ? "No bio yet — add one!" : "No bio yet."}
                  </span>
                )}
              </p>
              {isOwnProfile && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-gray-400 hover:text-teal-700 text-xs font-semibold
                             flex-shrink-0 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-4">
          {[
            { label: "Posts", value: posts.length === 5 ? "5+" : posts.length },
            { label: "Questions", value: questions.length === 5 ? "5+" : questions.length },
            { label: "Joined", value: joined },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-2">
              <p className="text-lg font-bold text-teal-800">{value}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT POSTS */}
      {posts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Recent Posts
          </h2>
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate("/feed")}
              className="bg-white rounded-2xl lg:rounded-xl p-4 shadow border border-gray-200
                         space-y-1 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div
                className="text-sm text-gray-700 leading-relaxed line-clamp-2"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
              />
              <p className="text-[10px] text-gray-400">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* RECENT QUESTIONS */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Recent Questions
          </h2>
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => navigate("/qa")}
              className="bg-white rounded-2xl lg:rounded-xl p-4 shadow border border-gray-200
                         space-y-1 cursor-pointer hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-gray-700">{q.title}</p>
              <p className="text-[10px] text-gray-400">
                {new Date(q.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------
   PROFILE SKELETON
-------------------- */
function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white rounded-3xl lg:rounded-2xl p-6 shadow-xl border border-gray-200 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-3 w-56 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-4 w-4/5 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-3 border-t border-gray-100 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1 px-2">
              <div className="h-6 w-8 bg-gray-200 rounded-xl animate-pulse mx-auto" />
              <div className="h-3 w-12 bg-gray-200 rounded-xl animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
