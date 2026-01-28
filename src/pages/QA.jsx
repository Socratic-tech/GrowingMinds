import { Button } from "../components/ui/button";
import { useState } from "react";

export default function QA() {
  const [showAskBox, setShowAskBox] = useState(false);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-teal-700">Q & A</h1>
        <p className="text-gray-500 text-sm">Ask questions & share insights 💬</p>
      </div>

      {/* Ask Question Toggle */}
      <Button
        onClick={() => setShowAskBox(!showAskBox)}
        className="bg-orange-600 hover:bg-orange-700"
      >
        {showAskBox ? "Close" : "Ask a Question"}
      </Button>

      {/* Ask Box */}
      {showAskBox && (
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <textarea
            placeholder="What do you want to ask?"
            className="w-full p-3 border rounded-lg text-sm"
            rows={3}
          />

          <div className="flex justify-end mt-3">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Questions List Placeholder */}
      <div className="space-y-4 text-gray-500 text-sm">
        <div className="bg-gray-100 border rounded-xl p-4">
          Questions will appear here...
        </div>
      </div>

    </div>
  );
}
