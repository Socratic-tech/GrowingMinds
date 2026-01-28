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

  // ----------------------------
  // FETCH POSTS
  // ----------------------------
  async function fetchPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(email)")
      .order("created_at", { ascending: false });

    if (error) {
      showToast({
        title: "Error loading posts",
        description: error.message,
        type: "error",
      });
    } else {
      setPosts(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  // ----------------------------
  // CREATE POST
  // ----------------------------
  async function createPost() {
    if (!content.trim() && !imageFile) {
      showToast({ title: "Post is empty", type: "error" });
      return;
    }

    setCreating(true);

    let publicUrl = null;

    // Upload image if provided
    if (imageFile) {
      const fileName = `${user.id}-${Date.now()}-${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        showToast({
          title: "Image upload failed",
          description: upload.message,
          type: "error",
        });
        setCreating(false);
        return;
      }

      const { data } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      publicUrl = data.publicUrl;
    }

    // Insert into posts table
    const { error } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        content: content,
        image_url: publicUrl,
      },
    ]);

    if (error) {
      showToast({
        title: "Could not create post",
        description: error.message,
        type: "error",
      });
    } else {
      showToast({ title: "Posted!", type: "success" });
      setContent("");
      setImageFile(null);
      fetchPosts();
    }

    setCreating(false);
  }

  // ----------------------------
  // DELETE POST (ADMIN ONLY)
  // ----------------------------
  async function deletePost(postId) {
    const ok = window.confirm("Delete this post?");
    if (!ok) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      showToast({
        title: "Delete failed",
        description: error.message,
        type: "error",
      });
    } else {
      showToast({ title: "Post deleted", type: "success" });
      fetchPosts();
    }
  }

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-700">Community Feed</h1>
        <p className="text-gray-500 text-sm">See what's growing today 🌱</p>
      </div>

      {/* Create Post */}
      <div className="bg-white border rounded-xl p-4 shadow-sm">
      <RichEditor value={content} onChange={setContent} />


        {/* Image Picker */}
        <input
          type="file"
          accept="image/*"
          className="mt-3 text-sm"
          onChange={(e) => setImageFile(e.target.files[0])}
        />

        <div className="flex justify-end mt-3">
          <Button
            onClick={createPost}
            disabled={creating}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {creating ? "Posting..." : "Post"}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && <div className="text-gray-500 text-sm">Loading posts...</div>}

      {/* Posts */}
      <div className="space-y-4">
        {!loading && posts.length === 0 && (
          <div className="text-gray-500 text-sm">
            No posts yet — be the first to share something!
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white border rounded-xl p-4 shadow-sm relative"
          >
            {/* Delete button (admin only) */}
            {isAdmin && (
              <button
                onClick={() => deletePost(post.id)}
                className="text-red-600 text-sm absolute top-2 right-2 hover:text-red-800"
              >
                🗑️
              </button>
            )}

            {/* Author */}
            <div className="font-bold text-sm text-teal-700">
              {post.profiles?.email?.split("@")[0] || "Unknown"}
            </div>

            {/* Text Content */}
           <div
  className="prose prose-sm mt-2"
  dangerouslySetInnerHTML={{ __html: post.content }}
></div>


            {/* Image */}
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="mt-3 rounded-lg border"
              />
            )}

            {/* Comments */}
            <CommentSection 
              postId={post.id}
              user={user}
              isAdmin={isAdmin}
              showToast={showToast}
            />
          </div>
        ))}
      </div>

    </div>
  );
}

//
// ------------------------------------------------------
// COMMENT SECTION COMPONENT
// ------------------------------------------------------
//

function CommentSection({ postId, user, isAdmin, showToast }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Fetch comments
  async function fetchComments() {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(email)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      showToast({
        title: "Error loading comments",
        description: error.message,
        type: "error"
      });
    } else {
      setComments(data || []);
    }
  }

  useEffect(() => {
    fetchComments();
  }, []);

  // Add new comment
  async function addComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert([
      {
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      }
    ]);

    if (error) {
      showToast({
        title: "Comment failed",
        description: error.message,
        type: "error",
      });
    } else {
      setNewComment("");
      fetchComments();
    }
  }

  // Delete comment
  async function deleteComment(commentId) {
    const ok = window.confirm("Delete this comment?");
    if (!ok) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      showToast({
        title: "Delete failed",
        description: error.message,
        type: "error",
      });
    } else {
      fetchComments();
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t pt-3">

      {/* Display Comments */}
      {comments.map((c) => (
        <div
          key={c.id}
          className="bg-gray-50 border rounded-xl p-3 relative group"
        >
          <div className="text-xs font-bold text-teal-700">
            {c.profiles?.email?.split("@")[0]}
          </div>

          <div className="text-sm text-gray-700">{c.content}</div>

          {(isAdmin || c.user_id === user.id) && (
            <button
              onClick={() => deleteComment(c.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* Add Comment */}
      <form onSubmit={addComment} className="flex gap-2">
        <input
          className="flex-1 border rounded-lg p-2 text-sm"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button className="bg-teal-600 hover:bg-teal-700 px-3 text-sm">
          Send
        </Button>
      </form>
    </div>
  );
}


