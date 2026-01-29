import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import RichEditor from "../components/ui/RichEditor";

export default function Feed() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
    setLoading(false);
  }

  async function createPost() {
    if (!content.trim() && !imageFile) {
      showToast({ title: "Write something or add a photo", type: "error" });
      return;
    }

    setCreating(true);
    let url = null;

    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        showToast({ title: "Upload failed", type: "error" });
        setCreating(false);
        return;
      }

      const pub = supabase.storage.from("post-images").getPublicUrl(fileName);
      url = pub.data.publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content,
      image_url: url,
    });

    if (error) {
      showToast({ title: "Post failed", type: "error" });
    } else {
      setContent("");
      setImageFile(null);
      fetchPosts();
    }

    setCreating(false);
  }

  async function deletePost(id) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    fetchPosts();
  }

  return (
    <div className="space-y-10">

      {/* CREATE POST CARD */}
      <div
        className="bg-white rounded-3xl lg:rounded-2xl p-6 shadow-xl border border-gray-200 
                   space-y-6"
      >
        <h2 className="text-xl lg:text-2xl font-bold text-teal-800 flex items-center gap-2">
          Update the Garden 🌱
        </h2>

        <RichEditor value={content} onChange={setContent} />

        {/* IMAGE UPLOAD */}
        <div className="space-y-1">
          <label className="text-sm lg:text-base font-semibold text-gray-600">
            Add Image
          </label>

          <label
            htmlFor="post-image-upload"
            className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 
                       px-4 py-2 rounded-xl text-sm lg:text-base shadow border border-gray-300 
                       inline-block focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Choose File
          </label>

          <input
            id="post-image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files[0])}
          />

          {imageFile && (
            <p className="text-xs lg:text-sm text-gray-500">{imageFile.name}</p>
          )}
        </div>

        <Button
          aria-label="Post update"
          className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 lg:py-4 
                     rounded-xl shadow-lg font-semibold text-sm lg:text-base"
          onClick={createPost}
          disabled={creating}
        >
          {creating ? "Posting…" : "Post"}
        </Button>
      </div>

      {/* POSTS */}
      {loading ? (
        <p className="text-center text-gray-400">Loading feed…</p>
      ) : (
        <div className="space-y-10 pb-24">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              onDelete={() => deletePost(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------
   POST CARD
-------------------- */
function PostCard({ post, user, isAdmin, onDelete }) {
  return (
    <div
      className="bg-white rounded-3xl lg:rounded-2xl p-6 shadow-lg 
                 border border-gray-200 space-y-5"
      role="region"
      aria-label={`Post by ${post.profiles?.email}`}
    >
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center 
                     justify-center font-bold text-sm"
        >
          {post.profiles?.email?.charAt(0).toUpperCase()}
        </div>

        {/* Author + Date */}
        <div className="flex flex-col">
          <p className="font-semibold text-teal-800 text-sm lg:text-base">
            {post.profiles?.email?.split("@")[0]}
          </p>
          <p className="text-[10px] lg:text-xs text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* ADMIN DELETE */}
        {isAdmin && (
          <button
            aria-label="Delete post"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-auto w-10 h-10 flex items-center justify-center rounded-xl
                       text-red-500 hover:text-red-700 text-lg focus-visible:ring-2 
                       focus-visible:ring-red-500"
          >
            🗑️
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div
        className="prose prose-sm lg:prose-base text-gray-800 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* IMAGE */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="rounded-3xl lg:rounded-2xl border border-gray-200 shadow-md"
        />
      )}

      {/* COMMENTS */}
      <CommentSection postId={post.id} user={user} isAdmin={isAdmin} />
    </div>
  );
}

/* --------------------
   COMMENT SECTION
-------------------- */
function CommentSection({ postId, user, isAdmin }) {
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(email)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    setComments(data || []);
  }

  useEffect(() => {
    loadComments();
  }, []);

  async function submitComment(e) {
    e.preventDefault();
    if (!text.trim()) return;

    await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: text,
    });

    setText("");
    loadComments();
  }

  async function deleteComment(id) {
    await supabase.from("comments").delete().eq("id", id);
    loadComments();
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200">

      {/* COMMENT LIST */}
      {comments.map((c) => (
        <div
          key={c.id}
          className="
            bg-gray-50 p-3 rounded-3xl lg:rounded-2xl border border-gray-200 
            shadow-sm relative
          "
          role="group"
          aria-label={`Comment by ${c.profiles?.email}`}
        >
          <p className="text-xs lg:text-sm font-semibold text-teal-800">
            {c.profiles?.email?.split("@")[0]}
          </p>

          <p className="text-sm lg:text-base text-gray-700">{c.content}</p>

          {isAdmin && (
            <button
              aria-label="Delete comment"
              onClick={() => deleteComment(c.id)}
              className="
                absolute top-2 right-3 w-8 h-8 flex items-center justify-center 
                rounded-xl text-red-400 hover:text-red-600 text-xs 
                focus-visible:ring-2 focus-visible:ring-red-500
              "
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* NEW COMMENT FORM */}
      <form onSubmit={submitComment} className="flex gap-2">
        <label htmlFor={`comment-input-${postId}`} className="sr-only">
          Add a comment
        </label>

        <input
          id={`comment-input-${postId}`}
          className="flex-1 p-2 rounded-xl lg:rounded-lg border border-gray-300 
                     text-sm lg:text-base shadow-inner focus-visible:ring-2 
                     focus-visible:ring-teal-700"
          placeholder="Write a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <Button
          aria-label="Submit comment"
          className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 
                     w-12 h-12 flex items-center justify-center text-lg"
        >
          ➤
        </Button>
      </form>
    </div>
  );
}
