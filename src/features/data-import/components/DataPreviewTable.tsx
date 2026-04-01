import type { DataRow } from "@/features/data-import/types";
import { formatCellValue } from "@/features/data-import/utils/formatters";

type DataPreviewTableProps = {
  columns: string[];
  rows: DataRow[];
};

export function DataPreviewTable({ columns, rows }: DataPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-surface-600 bg-surface-900/60 p-4 text-sm text-slate-300">
        Arquivo carregado sem linhas de dados apos o cabecalho.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-600 bg-surface-900/50">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface-700/85 backdrop-blur">
          <tr className="border-b border-surface-600">
            <th className="w-10 whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
              #
            </th>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-300"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`preview-row-${rowIndex}`}
              className="border-b border-surface-700/70 transition duration-150 hover:bg-surface-700/35"
            >
              <td className="px-3 py-2 text-xs text-slate-500">{rowIndex + 1}</td>
              {columns.map((column) => (
                <td
                  key={`${rowIndex}-${column}`}
                  className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-slate-200"
                  title={formatCellValue(row[column])}
                >
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
