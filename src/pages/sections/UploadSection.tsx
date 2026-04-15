import { useRef, useState, type DragEvent } from "react";
import { InfoBadge } from "@/components/ui/InfoBadge";
import { SectionCard } from "@/components/ui/SectionCard";
import { DataPreviewTable } from "@/features/data-import/components/DataPreviewTable";
import type { UseLocalDataImportResult } from "@/features/data-import/hooks/useLocalDataImport";
import { formatFileSize, formatFileType } from "@/features/data-import/utils/formatters";

const ACCEPTED_FILES = ".csv,.xlsx,.xls";

type UploadSectionProps = Pick<
  UseLocalDataImportResult,
  "status" | "dataset" | "restoredFromStorage" | "restoredAt" | "errorMessage" | "loadFile" | "clearData"
>;

function DataMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-surface-600 bg-surface-900/70 p-3 transition duration-200 hover:border-surface-500">
      <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-slate-100">{value}</p>
    </article>
  );
}

export function UploadSection({
  status,
  dataset,
  restoredFromStorage,
  restoredAt,
  errorMessage,
  loadFile,
  clearData,
}: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const isLoading = status === "loading";

  const handleFileSelection = async (files: FileList | null) => {
    const selectedFile = files?.[0] ?? null;
    await loadFile(selectedFile);
  };

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    await handleFileSelection(event.dataTransfer.files);
  };

  return (
    <SectionCard
      title="Entrada local de dados"
      description="Importe CSV, XLSX ou XLS para diagnosticar rapidamente sem sair do navegador."
      className="h-full"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <InfoBadge className="self-start">Privacidade por padrao: processamento local</InfoBadge>
          <span className="rounded-full border border-slate-500/60 bg-surface-900/80 px-3 py-1 text-xs text-slate-300">
            Nenhum upload para servidor
          </span>
        </div>

        <label
          id="upload-local"
          htmlFor="local-file-upload"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          className={`group block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition duration-200 ${
            isDragActive
              ? "border-cyan-300 bg-cyan-400/10"
              : "border-slate-500/60 bg-surface-900/70 hover:border-cyan-300/70 hover:bg-surface-900"
          }`}
        >
          <input
            ref={inputRef}
            id="local-file-upload"
            type="file"
            className="hidden"
            accept={ACCEPTED_FILES}
            onChange={async (event) => {
              await handleFileSelection(event.target.files);
              event.currentTarget.value = "";
            }}
          />

          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-surface-500 bg-surface-800 text-cyan-200 transition duration-200 group-hover:border-cyan-300/60 group-hover:text-cyan-100">
            +
          </div>
          <p className="font-medium text-slate-100">
            Arraste e solte o arquivo aqui ou clique para selecionar
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Formatos aceitos: <span className="text-slate-200">CSV, XLSX, XLS</span>
          </p>
          {isLoading ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-200" />
              Lendo arquivo localmente...
            </div>
          ) : null}
        </label>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-300/50 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <p className="font-medium">Nao foi possivel carregar o arquivo</p>
            <p className="mt-1 text-rose-200/90">{errorMessage}</p>
          </div>
        ) : null}

        {dataset ? (
          <>
            {restoredFromStorage ? (
              <div className="rounded-xl border border-emerald-300/45 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                <p className="font-medium">Diagnostico restaurado localmente</p>
                <p className="mt-1 text-emerald-200/90">
                  Fonte: ultimo estado salvo no navegador
                  {restoredAt ? ` em ${new Date(restoredAt).toLocaleString("pt-BR")}` : ""}.
                </p>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DataMetric label="Arquivo" value={dataset.fileName} />
              <DataMetric label="Tipo" value={formatFileType(dataset.fileType)} />
              <DataMetric label="Tamanho" value={formatFileSize(dataset.fileSizeBytes)} />
              <DataMetric label="Linhas carregadas" value={dataset.rowCount} />
              <DataMetric label="Colunas" value={dataset.columnCount} />
              <DataMetric label="MIME reportado" value={dataset.mimeType} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-slate-100">Preview tabular</h3>
                <button
                  type="button"
                  onClick={clearData}
                  className="rounded-lg border border-surface-500 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-300 transition duration-200 hover:border-slate-400 hover:text-slate-100"
                >
                  Limpar
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Exibindo as primeiras {dataset.previewRows.length} linhas para inspecao inicial.
              </p>
              <DataPreviewTable columns={dataset.columns} rows={dataset.previewRows} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-500/60 bg-surface-900/60 p-4">
            <p className="font-medium text-slate-200">Pronto para importar</p>
            <p className="mt-1 text-sm text-slate-400">
              Carregue um arquivo para visualizar amostra, diagnostico e sugestoes de tratamento.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
