import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "../supabase/client";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthProvider";
import RichEditor from "../components/ui/RichEditor";
import { FeedSkeleton } from "../components/ui/Skeleton";
import { displayName, initials } from "../utils/displayName";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PAGE_SIZE = 20;
const COMMENT_LIMIT = 50;
const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";

function uniqueFileName(userId, ext) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${userId}-${Date.now()}-${rand}.${ext}`;
}

function sanitizedExt(name) {
  const ext = (name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
}

// Compress image to target size
async function compressImage(file, maxSize = MAX_FILE_SIZE) {
  // If already under limit, return as-is
  if (file.size <= maxSize) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error("Image compression timeout"));
    }, 30000); // 30 second timeout

    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;

      // Scale down large images more aggressively
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Start with lower quality for faster compression
      canvas.toBlob(
        (blob) => {
          clearTimeout(timeout);
          if (blob && blob.size <= maxSize) {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          } else if (blob) {
            // If still too large, compress more
            canvas.toBlob(
              (blob2) => {
                if (!blob2) {
                  reject(new Error("Failed to compress image"));
                  return;
                }
                resolve(new File([blob2], file.name, { type: "image/jpeg" }));
              },
              "image/jpeg",
              0.5
            );
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        0.7
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

export default function Feed() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);       // next page index to load
  const [hasMore, setHasMore] = useState(true);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPosts(0);

    // Subscribe to new posts — prepend directly instead of full reload
    const channel = supabase
      .channel('posts-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          // Fetch the new post with profile data and prepend it
          const { data } = await supabase
            .from("posts")
            .select("*, profiles(*)")
            .eq("id", payload.new.id)
            .single();
          if (data) addPostLocally(data);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Prepend a post unless we already have it (realtime + own insert can race).
  function addPostLocally(row) {
    setPosts((prev) => (prev.some((p) => p.id === row.id) ? prev : [row, ...prev]));
  }

  async function fetchPosts(pageNum) {
    const from = pageNum * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    if (pageNum === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        showToast({ title: "Failed to load posts", description: error.message, type: "error" });
      } else {
        const newPosts = data || [];
        setPosts((prev) => {
          if (pageNum === 0) return newPosts;
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...newPosts.filter((p) => !seen.has(p.id))];
        });
        setPage(pageNum + 1);
        setHasMore(newPosts.length === PAGE_SIZE);
      }
    } catch (err) {
      showToast({ title: "Error loading posts", description: err.message, type: "error" });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function createPost() {
    if (creating) return;
    if (!content.trim() && !imageFile) {
      showToast({ title: "Write something or add a photo", type: "error" });
      return;
    }

    setCreating(true);
    let url = null;

    try {
      if (imageFile) {
        // Show compression feedback
        showToast({ title: "Compressing image...", type: "info" });

        // Compress image if over 5MB
        const processedFile = await compressImage(imageFile);

        if (!processedFile || processedFile.size > MAX_FILE_SIZE) {
          showToast({
            title: "Image is too large",
            description: "Please choose a photo under 5 MB.",
            type: "error",
          });
          return;
        }

        // Sanitized, unique filename. Compressed output is always JPEG.
        const wasCompressed = processedFile !== imageFile;
        const fileExt = wasCompressed ? "jpg" : sanitizedExt(imageFile.name);
        const fileName = uniqueFileName(user.id, fileExt);

        showToast({ title: "Uploading image...", type: "info" });

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(fileName, processedFile, { contentType: processedFile.type || undefined });

        if (uploadError) {
          showToast({
            title: "Upload failed",
            description: uploadError.message,
            type: "error"
          });
          return;
        }

        const pub = supabase.storage.from("post-images").getPublicUrl(fileName);
        url = pub.data.publicUrl;
      }

      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          image_url: url,
        })
        .select("*, profiles(*)")
        .single();

      if (error) {
        showToast({ title: "Post failed", description: error.message, type: "error" });
      } else {
        showToast({ title: "Posted successfully!", type: "success" });
        setContent("");
        setImageFile(null);
        if (newPost) addPostLocally(newPost);
      }
    } catch (err) {
      console.error("Create post error:", err);
      showToast({
        title: "Error creating post",
        description: err.message,
        type: "error"
      });
    } finally {
      setCreating(false);
    }
  }

  const deletePost = useCallback(async (id) => {
    if (!confirm("Delete this post?")) return;
    const { data, error } = await supabase.from("posts").delete().eq("id", id).select();
    if (error) {
      showToast({ title: "Failed to delete post", description: error.message, type: "error" });
    } else if (!data || data.length === 0) {
      // RLS filtered the delete out silently.
      showToast({ title: "Couldn't delete — you may not have permission", type: "error" });
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast({ title: "Post deleted", type: "success" });
    }
  }, [showToast]);

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

        <RichEditor value={content} onChange={setContent} ariaLabel="Post content" />

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
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              e.target.value = ""; // allow re-selecting the same file
              if (f && !ACCEPTED_IMAGE_TYPES.split(",").includes(f.type)) {
                showToast({
                  title: "Unsupported image type",
                  description: "Please choose a JPEG, PNG, WebP, or GIF.",
                  type: "error",
                });
                return;
              }
              setImageFile(f);
            }}
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
        <FeedSkeleton />
      ) : (
        <div className="space-y-10 pb-24">
          {posts.length === 0 && (
            <div className="bg-white rounded-3xl lg:rounded-2xl p-8 shadow border border-gray-200
                            text-center text-gray-500 text-sm lg:text-base">
              <p className="text-3xl mb-2" aria-hidden="true">🌱</p>
              No posts yet — share what's growing in your classroom!
            </div>
          )}

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={user}
              isAdmin={isAdmin}
              onDelete={deletePost}
            />
          ))}

          {/* LOAD MORE */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={() => fetchPosts(page)}
                disabled={loadingMore}
                className="bg-white border border-teal-700 text-teal-700 hover:bg-teal-50
                           px-8 py-3 rounded-xl shadow font-semibold text-sm lg:text-base
                           disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more posts"}
              </Button>
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <p className="text-center text-xs text-gray-400 pb-4">
              You've reached the end of the feed
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------
   POST CARD
-------------------- */
const PostCard = memo(function PostCard({ post, user, isAdmin, onDelete }) {
  const navigate = useNavigate();
  const author = displayName(post.profiles);
  const canDelete = isAdmin || post.user_id === user?.id;

  return (
    <div
      className="bg-white rounded-3xl lg:rounded-2xl p-6 shadow-lg
                 border border-gray-200 space-y-5"
      role="region"
      aria-label={`Post by ${author}`}
    >
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <button
          aria-label={`View profile of ${author}`}
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="w-10 h-10 rounded-full bg-teal-700 text-white flex items-center
                     justify-center font-bold text-sm flex-shrink-0 hover:opacity-80
                     transition-opacity focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          {initials(post.profiles)}
        </button>

        {/* Author + Date */}
        <div className="flex flex-col">
          <button
            onClick={() => navigate(`/profile/${post.user_id}`)}
            className="font-semibold text-teal-800 text-sm lg:text-base text-left
                       hover:underline focus-visible:underline"
          >
            {author}
          </button>
          <p className="text-[10px] lg:text-xs text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* DELETE (owner or admin) */}
        {canDelete && (
          <button
            aria-label="Delete post"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(post.id);
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
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
      />

      {/* IMAGE */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          loading="lazy"
          className="rounded-3xl lg:rounded-2xl border border-gray-200 shadow-md"
        />
      )}

      {/* COMMENTS */}
      <CommentSection postId={post.id} user={user} isAdmin={isAdmin} />
    </div>
  );
});

/* --------------------
   COMMENT SECTION
-------------------- */
function CommentSection({ postId, user, isAdmin }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Bounded: newest COMMENT_LIMIT comments, displayed oldest-first.
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(*)")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(COMMENT_LIMIT);

      if (cancelled) return;
      if (error) {
        showToast({ title: "Failed to load comments", type: "error" });
      } else {
        setComments((data || []).reverse());
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  async function submitComment(e) {
    e.preventDefault();
    if (submitting || !text.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content: text,
        })
        .select("*, profiles(*)")
        .single();

      if (error) {
        showToast({ title: "Failed to post comment", description: error.message, type: "error" });
      } else {
        setText("");
        if (data) {
          setComments((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id) {
    if (!confirm("Delete this comment?")) return;
    const { data, error } = await supabase.from("comments").delete().eq("id", id).select();
    if (error) {
      showToast({ title: "Failed to delete comment", description: error.message, type: "error" });
    } else if (!data || data.length === 0) {
      showToast({ title: "Couldn't delete — you may not have permission", type: "error" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
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
          aria-label={`Comment by ${displayName(c.profiles)}`}
        >
          <button
            onClick={() => navigate(`/profile/${c.user_id}`)}
            className="text-xs lg:text-sm font-semibold text-teal-800 hover:underline
                       text-left focus-visible:underline"
          >
            {displayName(c.profiles)}
          </button>

          <p className="text-sm lg:text-base text-gray-700">{c.content}</p>

          {(isAdmin || c.user_id === user?.id) && (
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
          type="submit"
          aria-label="Submit comment"
          disabled={submitting || !text.trim()}
          className="bg-teal-700 hover:bg-teal-800 text-white rounded-xl px-4 
                     w-12 h-12 flex items-center justify-center text-lg"
        >
          ➤
        </Button>
      </form>
    </div>
  );
}
