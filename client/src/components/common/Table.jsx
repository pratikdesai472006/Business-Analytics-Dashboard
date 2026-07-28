import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "./cn";
import { Skeleton } from "./Loader";

/**
 * Reusable, accessible data table.
 * columns: [{ key, header, align, sortable, render(row) }]
 */
function Table({
  columns,
  data,
  sort,
  onSort,
  loading = false,
  emptyState = null,
  getRowKey = (row, i) => row.id ?? i,
}) {
  const alignClass = { right: "text-right", center: "text-center" };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => {
              const active = sort?.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-subtle",
                    "whitespace-nowrap",
                    col.align === "right" ? "text-right" : "text-left",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
                        active && "text-primary"
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort.dir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, r) => (
              <tr key={r} className="border-b border-border/60">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16">
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                className="border-b border-border/60 transition-colors hover:bg-surface/70 last:border-0"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-foreground align-middle",
                      alignClass[col.align]
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
