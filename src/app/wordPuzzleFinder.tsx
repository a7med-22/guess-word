"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const DICTIONARY_API = "https://api.datamuse.com/words";

interface WordItem {
  word: string;
  defs?: string[];
}

const WordPuzzleFinder = () => {
  const [letters, setLetters] = useState<string>("");
  const [length, setLength] = useState<string>("");
  const [pattern, setPattern] = useState<string>("");
  const [excludedLetters, setExcludedLetters] = useState<string>("");
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    let finalPattern = pattern;
    if (!pattern && length) finalPattern = "?".repeat(Number(length));
    if (finalPattern) params.append("sp", finalPattern.toLowerCase());
    if (excludedLetters) {
      params.append(
        "q",
        excludedLetters
          .toLowerCase()
          .split("")
          .map((l) => `-${l}`)
          .join(" ")
      );
    }
    params.append("max", "200");
    params.append("md", "d");
    return params;
  };

  const fetchWords = async () => {
    try {
      setIsLoading(true);
      const queryParams = buildQueryParams();
      const response = await fetch(`${DICTIONARY_API}?${queryParams}`);
      if (response.status === 429) throw new Error("API rate limit exceeded");
      if (!response.ok) throw new Error("Failed to fetch words");
      const data: WordItem[] = await response.json();
      const filteredWords = data
        .filter((item) => {
          const word = item.word.toUpperCase();
          return (
            (!length || word.length === Number(length)) &&
            (!letters || letters.split("").every((l) => word.includes(l))) &&
            (!excludedLetters ||
              !excludedLetters.split("").some((l) => word.includes(l)))
          );
        })
        .map((item) => item.word.toUpperCase());

      setResults(filteredWords);
      setError(filteredWords.length ? "" : "No matches found");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch words");
    } finally {
      setIsLoading(false);
    }
  };

  const validateInputs = () => {
    if (!letters && !pattern && !length)
      return "Enter at least one search criteria";
    if (pattern && length && pattern.length !== Number(length))
      return "Pattern length must match word length";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateInputs();
    if (validationError) return setError(validationError);
    setError("");
    fetchWords();
  };

  return (
    <div className="flex flex-col items-center p-6 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <h1 className="text-5xl font-extrabold mb-8 mt-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        Guess word
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-2xl space-y-6 border border-slate-700"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Included Letters
              </label>
              <input
                type="text"
                placeholder="e.g., AUL"
                className="w-full p-4 text-lg bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-white placeholder-slate-400 transition-all"
                value={letters}
                onChange={(e) =>
                  setLetters(
                    e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Excluded Letters
              </label>
              <input
                type="text"
                placeholder="e.g., CYT"
                className="w-full p-4 text-lg bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-white placeholder-slate-400 transition-all"
                value={excludedLetters}
                onChange={(e) =>
                  setExcludedLetters(
                    e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                  )
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Word Length
              </label>
              <input
                type="number"
                placeholder="Optional length"
                className="w-full p-4 text-lg bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-white placeholder-slate-400 transition-all"
                value={length}
                min="1"
                max="15"
                onChange={(e) => setLength(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">
                Word Pattern
              </label>
              <input
                type="text"
                placeholder="e.g., ??RA?"
                className="w-full p-4 text-lg bg-slate-700 rounded-lg border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 text-white placeholder-slate-400 transition-all"
                value={pattern}
                maxLength={Number(length)}
                onChange={(e) =>
                  setPattern(
                    e.target.value.toUpperCase().replace(/[^A-Z?]/g, "")
                  )
                }
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-400/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-lg font-semibold text-white rounded-lg transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🌀</span>
              Searching...
            </span>
          ) : (
            "Find Words"
          )}
        </button>
      </form>

      <div className="mt-8 bg-slate-800 p-6 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700">
        <h2 className="text-xl font-bold mb-4 text-slate-300">
          Results ({results.length})
        </h2>
        <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {results.map((word) => (
            <motion.div
              key={word}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 bg-slate-700/50 rounded-lg text-center font-mono text-slate-100 hover:bg-slate-600/50 transition-colors cursor-pointer hover:text-blue-300 border border-slate-600 hover:border-blue-400/50"
              title="Click to copy"
              onClick={() => {
                navigator.clipboard.writeText(word);
                toast.success("Word copied!"); // Show success toast notification
              }}
            >
              {word}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default WordPuzzleFinder;
