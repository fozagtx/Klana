"use client";

import { BookOpen, Newspaper, Search, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
// API route will be used instead of server action
import { Results } from "@/components/Results";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { cn } from "@/lib/utils";

// Define search categories for general student learning
const searchCategories = [
  {
    id: "general",
    label: "All Subjects",
    icon: Search,
    color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  },
  {
    id: "academic",
    label: "Academic",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  {
    id: "news",
    label: "Current Events",
    icon: Newspaper,
    color: "bg-green-100 text-green-700 hover:bg-green-200",
  },
] as const;

// Suggested search queries for general student learning
const quickSearches = [
  "Algebra basics",
  "World history overview",
  "Biology cell structure",
  "English literature analysis",
  "Geography of Europe",
  "Chemistry periodic table",
];

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "general" | "academic" | "news"
  >("general");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Handle search submission
  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          category: selectedCategory,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults({
          query,
          category: selectedCategory,
          status: "complete",
          totalResults: 0,
          results: [],
          suggestions: [],
          educationalLevel:
            selectedCategory === "academic" ? "university" : "general",
          timestamp: new Date().toISOString(),
          aiResponse: result.aiResponse,
        });
      } else {
        setSearchError(result.error || "Search failed");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick search selection
  const handleQuickSearch = async (quickQuery: string) => {
    setQuery(quickQuery);
    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: quickQuery,
          category: selectedCategory,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults({
          query: quickQuery,
          category: selectedCategory,
          status: "complete",
          totalResults: 0,
          results: [],
          suggestions: [],
          educationalLevel:
            selectedCategory === "academic" ? "university" : "general",
          timestamp: new Date().toISOString(),
          aiResponse: result.aiResponse,
        });
      } else {
        setSearchError(result.error || "Search failed");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-semibold text-gray-900 mb-4">
              Find Educational Resources
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Discover curated study materials, articles, and resources to
              support your academic journey.
            </p>

            {/* Search Categories */}
            <div className="flex justify-center gap-4 mb-8">
              {searchCategories.map(({ id, label, icon: Icon, color }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    selectedCategory === id
                      ? "bg-blue-600 text-white shadow-sm"
                      : color,
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto">
              <PromptInput className="border border-gray-300 rounded-lg shadow-sm">
                <PromptInputTextarea
                  placeholder="Search for topics like 'Algebra basics' or 'World history'..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-base py-3 px-4 min-h-[48px] resize-none"
                />
                <PromptInputActions>
                  <PromptInputAction
                    onClick={handleSearch}
                    disabled={!query.trim() || isLoading}
                    className={cn(
                      "bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed",
                      isLoading && "animate-pulse",
                    )}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        <span className="ml-2">Search</span>
                      </>
                    )}
                  </PromptInputAction>
                </PromptInputActions>
              </PromptInput>
            </div>

            {/* Quick Searches */}
            {!hasSearched && (
              <div className="mt-8">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  Explore Popular Topics
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                  {quickSearches.map((quickQuery) => (
                    <button
                      type="button"
                      key={quickQuery}
                      onClick={() => handleQuickSearch(quickQuery)}
                      className="text-left px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-colors text-sm text-gray-700"
                    >
                      {quickQuery}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results and Tips Section */}
      <div className="container mx-auto px-6 py-8">
        {/* Search Results */}
        {hasSearched && (
          <Results
            data={searchResults}
            isLoading={isLoading}
            error={searchError}
          />
        )}

        {/* Study Tips */}
        {!hasSearched && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Search className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Effective Search Tips
                  </h3>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>Use clear and specific keywords for better results.</li>
                  <li>Select a category to narrow your search focus.</li>
                  <li>Explore related topics to expand your knowledge.</li>
                </ul>
              </div>

              <div className="p-6 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="text-green-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Study Tips
                  </h3>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>Start with foundational resources for new subjects.</li>
                  <li>Take notes to reinforce your learning.</li>
                  <li>Use multiple sources to deepen understanding.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
