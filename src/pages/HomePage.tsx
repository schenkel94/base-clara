import { AppShell } from "@/components/layout/AppShell";
import { HeroSection } from "@/components/sections/HeroSection";
import { LanguageTabsSection } from "@/features/code-suggestions/components/LanguageTabsSection";
import { AnalysisResultsSection } from "@/features/data-quality/components/AnalysisResultsSection";
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

      <AnalysisResultsSection dataset={dataset} result={analysisResult} />

      <LanguageTabsSection dataset={dataset} analysisResult={analysisResult} />

      <TechnicalChecklistSection analysisResult={analysisResult} />
    </AppShell>
  );
}
