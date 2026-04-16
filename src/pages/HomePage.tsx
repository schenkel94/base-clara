import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { HeroSection } from "@/components/sections/HeroSection";
import { LanguageTabsSection } from "@/features/code-suggestions/components/LanguageTabsSection";
import { AnalysisResultsSection } from "@/features/data-quality/components/AnalysisResultsSection";
import { buildEffectiveAnalysisResult } from "@/features/data-quality/utils/effectiveAnalysisResult";
import { useLocalDataImport } from "@/features/data-import/hooks/useLocalDataImport";
import { TechnicalChecklistSection } from "@/features/technical-checklist/components/TechnicalChecklistSection";
import { UploadSection } from "@/pages/sections/UploadSection";

export function HomePage() {
  const {
    status,
    dataset,
    analysisResult,
    restoredFromStorage,
    restoredAt,
    errorMessage,
    loadFile,
    clearData,
  } = useLocalDataImport();
  const [ignoredProblemIds, setIgnoredProblemIds] = useState<string[]>([]);

  useEffect(() => {
    setIgnoredProblemIds([]);
  }, [analysisResult?.summary.analyzedAt]);

  const effectiveAnalysisResult = useMemo(() => {
    return buildEffectiveAnalysisResult(analysisResult, new Set(ignoredProblemIds));
  }, [analysisResult, ignoredProblemIds]);

  const handleToggleIgnoredProblem = (problemId: string) => {
    setIgnoredProblemIds((current) => {
      if (current.includes(problemId)) {
        return current.filter((id) => id !== problemId);
      }

      return [...current, problemId];
    });
  };

  const handleClearIgnoredProblems = () => {
    setIgnoredProblemIds([]);
  };

  return (
    <AppShell>
      <HeroSection />

      <UploadSection
        status={status}
        dataset={dataset}
        restoredFromStorage={restoredFromStorage}
        restoredAt={restoredAt}
        errorMessage={errorMessage}
        loadFile={loadFile}
        clearData={clearData}
      />

      <AnalysisResultsSection
        dataset={dataset}
        result={analysisResult}
        effectiveResult={effectiveAnalysisResult}
        ignoredProblemIds={ignoredProblemIds}
        onToggleIgnoreProblem={handleToggleIgnoredProblem}
        onClearIgnoredProblems={handleClearIgnoredProblems}
      />

      <LanguageTabsSection dataset={dataset} analysisResult={effectiveAnalysisResult} />

      <TechnicalChecklistSection analysisResult={effectiveAnalysisResult} />

      <footer className="rounded-2xl border border-surface-600 bg-surface-900/60 px-4 py-4 text-sm text-slate-300 md:px-5">
        <p className="font-medium text-slate-200">Powered by Mario Schenkel - Data Analyst</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <a
            href="https://schenkel94.github.io/portfolio/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Portfolio
          </a>
          <span className="text-slate-600">|</span>
          <a
            href="https://www.linkedin.com/in/marioschenkel/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-300 transition-colors hover:text-cyan-200"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </AppShell>
  );
}
