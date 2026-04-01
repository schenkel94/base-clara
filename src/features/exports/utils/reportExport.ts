import type { DataQualityAnalysisResult } from "@/features/data-quality/types";
import type { LoadedDataset } from "@/features/data-import/types";

type DiagnosticExportPayload = {
  generatedAt: string;
  app: "Antes do Dashboard";
  dataset: {
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    mimeType: string;
    rowCount: number;
    columnCount: number;
    columns: string[];
  };
  analysis: DataQualityAnalysisResult;
};

function sanitizeFileBaseName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTimestampId() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildPayload(dataset: LoadedDataset, result: DataQualityAnalysisResult): DiagnosticExportPayload {
  return {
    generatedAt: new Date().toISOString(),
    app: "Antes do Dashboard",
    dataset: {
      fileName: dataset.fileName,
      fileType: dataset.fileType,
      fileSizeBytes: dataset.fileSizeBytes,
      mimeType: dataset.mimeType,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: dataset.columns,
    },
    analysis: result,
  };
}

export function buildDiagnosticMarkdown(dataset: LoadedDataset, result: DataQualityAnalysisResult) {
  const lines: string[] = [];

  lines.push("# Relatorio tecnico - Antes do Dashboard");
  lines.push("");
  lines.push(`Gerado em: ${new Date().toLocaleString("pt-BR")}`);
  lines.push(`Arquivo: ${dataset.fileName} (${dataset.fileType.toUpperCase()})`);
  lines.push("");

  lines.push("## Resumo");
  lines.push(`- Score de prontidao: **${result.summary.treatmentNeedScore}/100**`);
  lines.push(`- Linhas analisadas: ${result.summary.totalRows}`);
  lines.push(`- Colunas analisadas: ${result.summary.totalColumns}`);
  lines.push(`- Problemas detectados: ${result.summary.totalProblems}`);
  lines.push(`- Duplicidades: ${result.summary.duplicateRowCount}`);
  lines.push("");

  lines.push("## Problemas detectados");
  if (result.problems.length === 0) {
    lines.push("- Nenhum problema detectado pelas regras atuais.");
  } else {
    result.problems.slice(0, 25).forEach((problem) => {
      lines.push(`- [${problem.severity.toUpperCase()}] ${problem.title}`);
      lines.push(`  - Descricao: ${problem.description}`);
      lines.push(`  - Recomendacao: ${problem.recommendation}`);
    });
  }
  lines.push("");

  lines.push("## Prioridades recomendadas");
  if (result.priorities.length === 0) {
    lines.push("- Sem prioridades abertas.");
  } else {
    result.priorities.forEach((priority) => {
      lines.push(`- ${priority.title}: ${priority.rationale}`);
    });
  }
  lines.push("");

  lines.push("## Qualidade por coluna (resumo)");
  result.columnMetrics.slice(0, 30).forEach((column) => {
    lines.push(
      `- ${column.sourceName || column.columnKey}: nulos ${(
        column.nullPercentage * 100
      ).toFixed(1)}%, tipo ${column.inferredType}`,
    );
  });

  return lines.join("\n");
}

export function exportDiagnosticAsJson(dataset: LoadedDataset, result: DataQualityAnalysisResult) {
  const payload = buildPayload(dataset, result);
  const content = JSON.stringify(payload, null, 2);
  const base = sanitizeFileBaseName(dataset.fileName) || "diagnostico";
  const filename = `${base}-diagnostico-${getTimestampId()}.json`;
  downloadTextFile(content, filename, "application/json;charset=utf-8");
}

export function exportDiagnosticAsMarkdown(dataset: LoadedDataset, result: DataQualityAnalysisResult) {
  const content = buildDiagnosticMarkdown(dataset, result);
  const base = sanitizeFileBaseName(dataset.fileName) || "diagnostico";
  const filename = `${base}-relatorio-${getTimestampId()}.md`;
  downloadTextFile(content, filename, "text/markdown;charset=utf-8");
}

export function printDiagnosticReport(dataset: LoadedDataset, result: DataQualityAnalysisResult) {
  const markdown = buildDiagnosticMarkdown(dataset, result);
  const printableWindow = window.open("", "_blank", "noopener,noreferrer,width=980,height=760");

  if (!printableWindow) {
    return false;
  }

  printableWindow.document.write(`<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Relatorio - Antes do Dashboard</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 28px; color: #0f172a; }
      h1 { margin-bottom: 8px; }
      pre { white-space: pre-wrap; line-height: 1.5; font-size: 13px; }
      @media print { body { margin: 12mm; } }
    </style>
  </head>
  <body>
    <h1>Antes do Dashboard</h1>
    <pre>${escapeHtml(markdown)}</pre>
  </body>
</html>`);
  printableWindow.document.close();
  printableWindow.focus();
  printableWindow.print();
  return true;
}
