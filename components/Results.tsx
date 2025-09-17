"use client";

import {
  BookOpen,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Newspaper,
  TrendingUp,
} from "lucide-react";

// Types for search results
type SearchResult = {
  title: string;
  snippet: string;
  url: string;
  type: "educational" | "tutorial" | "reference" | "news";
  difficulty: "beginner" | "intermediate" | "advanced";
  readTime: string;
  rank: number;
  relevanceScore: number;
  searchQuery: string;
  category: string;
};

type SearchResultsData = {
  query: string;
  category: "general" | "academic" | "news" | "images";
  status: "loading" | "streaming" | "complete" | "error";
  totalResults: number;
  results: SearchResult[];
  suggestions: string[];
  educationalLevel: string;
  timestamp: string;
  aiResponse?: string;
  error?: string;
};

interface ResultsProps {
  className?: string;
  data?: SearchResultsData | null;
  isLoading?: boolean;
  error?: string | null;
}

export function Results({ className, data, isLoading, error }: ResultsProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tutorial":
        return <BookOpen size={18} />;
      case "reference":
        return <FileText size={18} />;
      case "news":
        return <Newspaper size={18} />;
      default:
        return <GraduationCap size={18} />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-50";
      case "intermediate":
        return "text-yellow-600 bg-yellow-50";
      case "advanced":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="animate-pulse">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-6 bg-white border border-gray-200 rounded-xl"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Search Error
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {data.query ? `"${data.query}"` : "Search Results"}
        </h2>
        <p className="text-gray-600">
          Found {data.totalResults || 0} educational resources
        </p>
      </div>

      {/* AI Response */}
      {data.aiResponse && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <TrendingUp size={20} />
            AI Analysis
          </h3>
          <div className="text-blue-800 whitespace-pre-wrap">
            {data.aiResponse}
          </div>
        </div>
      )}

      {/* Search Results */}
      {data.results && data.results.length > 0 && (
        <div className="space-y-6">
          {data.results.map((result, index) => (
            <article
              key={`${result.url}-${index}`}
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      {getTypeIcon(result.type)}
                      <span className="text-sm font-medium capitalize">
                        {result.type}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                        result.difficulty,
                      )}`}
                    >
                      {result.difficulty}
                    </span>

                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock size={14} />
                      <span className="text-sm">{result.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {result.title}
                    </a>
                  </h3>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {result.snippet}
                  </p>

                  <div className="flex items-center justify-between">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                    >
                      <span>Read More</span>
                      <ExternalLink size={16} />
                    </a>

                    <div className="text-sm text-gray-500">
                      Relevance: {Math.round(result.relevanceScore * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* No Results */}
      {data.results && data.results.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search terms or selecting a different category.
          </p>

          {/* Suggestions */}
          {data.suggestions && data.suggestions.length > 0 && (
            <div className="max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-3">
                Try these suggestions:
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.suggestions.map((suggestion, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    {suggestion}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {data.results &&
        data.results.length > 0 &&
        data.suggestions &&
        data.suggestions.length > 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-4 text-center">
              Related Topics
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
              {data.suggestions.map((suggestion, index) => (
                <span
                  key={index}
                  className="px-3 py-2 bg-white text-gray-700 rounded-full text-sm border border-gray-200 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
