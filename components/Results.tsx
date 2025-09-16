"use client";

import { useArtifact } from "@ai-sdk-tools/artifacts";
import {
  AlertCircle,
  BookOpen,
  Clock,
  ExternalLink,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { SearchResults } from "@/app/artifacts/search";

interface SearchResultsProps {
  className?: string;
}

export function Results({ className }: SearchResultsProps) {
  const { data, status, progress, error, isActive } = useArtifact(
    SearchResults,
    {
      onUpdate: (newData) => {
        console.log("Search data updated:", newData.status, newData.progress);
      },
      onComplete: (finalData) => {
        console.log(
          "Search complete! Found",
          finalData.totalResults,
          "results",
        );
      },
      onError: (error) => {
        console.error("Search failed:", error);
      },
      onProgress: (progress) => {
        console.log("Search progress:", `${Math.round(progress * 100)}%`);
      },
      onStatusChange: (newStatus, prevStatus) => {
        console.log("Search status:", prevStatus, "→", newStatus);
      },
    },
  );

  if (!data && !isActive) {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        );
      case "streaming":
        return (
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        );
      case "complete":
        return (
          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tutorial":
        return <BookOpen className="w-4 h-4" />;
      case "academic":
      case "reference":
        return <GraduationCap className="w-4 h-4" />;
      case "news":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className || ""}`}>
      {/* Header with Status */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {data?.query ? `"${data.query}"` : "Search Results"}
              </h2>
              <p className="text-gray-600">
                {status === "loading" && "Initializing search..."}
                {status === "streaming" && "Fetching results..."}
                {status === "complete" &&
                  `Found ${data?.totalResults || 0} educational resources`}
                {status === "error" && "Search failed"}
              </p>
            </div>
          </div>

          {data?.category && (
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
              {data.category}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(status === "loading" || status === "streaming") && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(progress || 0) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.round((progress || 0) * 100)}% complete
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {status === "error" && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Search Error</h3>
              <p className="text-red-700">
                {error ||
                  data?.error ||
                  "An unexpected error occurred while searching."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {data?.results && data.results.length > 0 && (
        <div className="space-y-6">
          {data.results.map((result, index) => (
            <article
              key={`${result.url}-${index}`}
              className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 card-hover"
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
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(result.difficulty)}`}
                    >
                      {result.difficulty}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="w-3 h-3" />
                      {result.readTime}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors duration-200"
                    >
                      {result.title}
                    </a>
                  </h3>

                  <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                    {result.snippet}
                  </p>

                  <div className="flex items-center justify-between">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200"
                    >
                      <span>Visit Resource</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Rank #{result.rank}</span>
                      <span>
                        Relevance: {Math.round(result.relevanceScore * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {data?.suggestions &&
        data.suggestions.length > 0 &&
        status === "complete" && (
          <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Related Learning Topics
            </h4>
            <div className="flex flex-wrap gap-3">
              {data.suggestions.map((suggestion, _index) => (
                <button
                  type="button"
                  key={suggestion}
                  className="px-4 py-2 bg-white border border-blue-200 rounded-full text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 text-sm font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Metadata */}
      {data?.timestamp && status === "complete" && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Search completed at {new Date(data.timestamp).toLocaleString()}</p>
          {data.educationalLevel && (
            <p>
              Educational level:{" "}
              <span className="capitalize font-medium">
                {data.educationalLevel}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
