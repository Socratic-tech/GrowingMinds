import { useState } from "react";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthProvider";

export default function Library() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-700">Library</h1>
        <p className="text-gray-500 text-sm">Helpful resources for educators 📘</p>
      </div>

      {/* Admin: Add Resource Toggle */}
      {isAdmin && (
        <Button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {showAdd ? "Close" : "Add Resource"}
        </Button>
      )}

      {/* Add Resource Box */}
      {showAdd && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <input
            type="text"
            placeholder="Resource title"
            className="w-full p-3 border rounded-lg mb-3 text-sm"
          />

          <input
            type="text"
            placeholder="URL"
            className="w-full p-3 border rounded-lg mb-3 text-sm"
          />

          <select className="w-full p-3 border rounded-lg mb-3 text-sm">
            <option>Guide</option>
            <option>Curriculum</option>
            <option>Video</option>
            <option>PDF</option>
            <option>Website</option>
          </select>

          <div className="flex justify-end">
            <Button className="bg-teal-600 hover:bg-teal-700">
              Add Resource
            </Button>
          </div>
        </div>
      )}

      {/* Resource List Placeholder */}
      <div className="space-y-4 text-gray-500 text-sm">
        <div className="bg-gray-100 border rounded-xl p-4">
          Resources will appear here...
        </div>
      </div>

    </div>
  );
}
