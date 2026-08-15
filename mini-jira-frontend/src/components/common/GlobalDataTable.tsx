/**
 * GlobalDataTable.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A reusable, fully-featured data-table component that provides:
 *   • Live search / filter across all visible columns
 *   • "Show N entries" selector  (10 / 25 / 50 / 100)
 *   • Pagination with ellipsis navigation
 *   • Export to Excel  (.xlsx)  via the "xlsx" library
 *   • Export to PDF    (.pdf)   via jsPDF + jspdf-autotable
 *   • Optional `actions` slot for extra buttons in the header
 *
 * Usage:
 *   <GlobalDataTable
 *     id="users-table"
 *     title="System Users"
 *     columns={[
 *       { key: 'firstName', label: 'Name',  render: (row) => <b>{row.firstName} {row.lastName}</b> },
 *       { key: 'email',     label: 'Email' },
 *       { key: 'roles',     label: 'Roles', noExport: false },
 *     ]}
 *     data={users}
 *     exportFileName="users"
 *     actions={<button ...>Add User</button>}
 *   />
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface DataTableColumn<T = any> {
  /** Field key on the row object (dot notation supported, e.g. "user.email") */
  key: string;
  /** Column header label */
  label: string;
  /** Optional custom JSX cell renderer */
  render?: (row: T, rowIndex: number) => React.ReactNode;
  /** Set true to hide this column from Excel / PDF exports */
  noExport?: boolean;
}

interface Props<T = any> {
  id: string;
  title?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  exportFileName?: string;
  /** Extra JSX placed to the right of the export buttons (e.g. an "Add" button) */
  actions?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safely read a (possibly nested) value by dot-notation key
// ─────────────────────────────────────────────────────────────────────────────
function getCellText(row: any, key: string): string {
  const val = key.split('.').reduce((obj: any, k: string) => obj?.[k], row);
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers  (dynamic import = xlsx/jspdf only loaded when user clicks)
// ─────────────────────────────────────────────────────────────────────────────
async function doExcelExport<T>(cols: DataTableColumn<T>[], rows: T[], name: string) {
  const XLSX = await import('xlsx');
  const exportCols = cols.filter((c) => !c.noExport);
  const header = exportCols.map((c) => c.label);
  const body   = rows.map((r) => exportCols.map((c) => getCellText(r, c.key)));
  const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${name}.xlsx`);
}

async function doPdfExport<T>(cols: DataTableColumn<T>[], rows: T[], name: string, title: string) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');           // attaches .autoTable to jsPDF prototype
  const exportCols = cols.filter((c) => !c.noExport);
  const doc: any = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(13);
  doc.text(title, 14, 14);
  doc.autoTable({
    head:            [exportCols.map((c) => c.label)],
    body:             rows.map((r) => exportCols.map((c) => getCellText(r, c.key))),
    startY:          20,
    styles:           { fontSize: 9, cellPadding: 3 },
    headStyles:       { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  doc.save(`${name}.pdf`);
}

function doPrint<T>(cols: DataTableColumn<T>[], rows: T[], title: string) {
  const exportCols = cols.filter((c) => !c.noExport);
  const header = exportCols.map((c) => c.label);
  const body   = rows.map((r) => exportCols.map((c) => getCellText(r, c.key)));
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups to print.');
    return;
  }
  
  const html = `
    <html>
      <head>
        <title>Print - ${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
          h1 { font-size: 20px; margin-bottom: 20px; color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background-color: #f1f5f9; font-weight: 600; color: #334155; }
          tr:nth-child(even) { background-color: #f8fafc; }
          @media print {
            body { padding: 0; }
            h1 { color: #000; border-bottom: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <table>
          <thead>
            <tr>
              ${header.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${body.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];

function GlobalDataTable<T extends Record<string, any>>({
  id,
  title = 'Data',
  columns,
  data,
  exportFileName,
  actions,
}: Props<T>) {
  const fileName = exportFileName ?? title.replace(/\s+/g, '_').toLowerCase();

  // State
  const [query,    setQuery]    = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page,     setPage]     = useState(1);

  // ── Filtered data (searches every column's plain-text value) ──────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q.trim()) return data;
    return data.filter((row) =>
      columns.some((col) => getCellText(row, col.key).toLowerCase().includes(q))
    );
  }, [data, columns, query]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const startIdx   = (safePage - 1) * pageSize;
  const pageRows   = filtered.slice(startIdx, startIdx + pageSize);

  const go = useCallback((n: number) => setPage(Math.max(1, Math.min(n, totalPages))), [totalPages]);

  const handleSearch = (v: string) => { setQuery(v); setPage(1); };
  const handleSize   = (v: number) => { setPageSize(v); setPage(1); };

  // Build the small page-number window around the current page
  const pageNums = useMemo(() => {
    const delta = 2;
    const nums: number[] = [];
    for (let i = Math.max(1, safePage - delta); i <= Math.min(totalPages, safePage + delta); i++) {
      nums.push(i);
    }
    return nums;
  }, [safePage, totalPages]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div id={id} className="card card-glass border-0 shadow-sm rounded-4 overflow-hidden">

      {/* ── Card header: title + export buttons + action slot ────────────── */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 border-bottom"
        style={{ background: 'rgba(248,250,252,0.8)' }}
      >
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          {title}
          <span
            className="badge badge-subtle-primary rounded-pill px-2 py-1 ms-1"
            style={{ fontSize: '0.67rem' }}
          >
            {filtered.length}
          </span>
        </h6>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Caller can pass extra buttons here (e.g. "Add User") */}
          {actions}

          {/* ── Excel export ── */}
          <button
            onClick={() => doExcelExport(columns, filtered, fileName)}
            className="btn btn-sm btn-light border rounded-3 d-flex align-items-center gap-1 px-3 py-1 fw-semibold text-success hover-scale"
            title="Export to Excel"
            style={{ fontSize: '0.78rem' }}
          >
            <FileSpreadsheet style={{ width: '15px', height: '15px' }} />
            <span className="d-none d-sm-inline">Excel</span>
          </button>

          {/* ── PDF export ── */}
          <button
            onClick={() => doPdfExport(columns, filtered, fileName, title)}
            className="btn btn-sm btn-light border rounded-3 d-flex align-items-center gap-1 px-3 py-1 fw-semibold text-danger hover-scale"
            title="Export to PDF"
            style={{ fontSize: '0.78rem' }}
          >
            <FileText style={{ width: '15px', height: '15px' }} />
            <span className="d-none d-sm-inline">PDF</span>
          </button>

          {/* ── Print ── */}
          <button
            onClick={() => doPrint(columns, filtered, title)}
            className="btn btn-sm btn-light border rounded-3 d-flex align-items-center gap-1 px-3 py-1 fw-semibold text-primary hover-scale"
            title="Print Table"
            style={{ fontSize: '0.78rem' }}
          >
            <Printer style={{ width: '15px', height: '15px' }} />
            <span className="d-none d-sm-inline">Print</span>
          </button>
        </div>
      </div>

      {/* ── Toolbar: "Show N entries" + search ───────────────────────────── */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-2 border-bottom"
        style={{ background: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}
      >
        {/* Show N entries */}
        <div className="d-flex align-items-center gap-2 text-muted">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => handleSize(Number(e.target.value))}
            className="form-select form-select-sm rounded-3 shadow-none border"
            style={{ width: '74px', fontSize: '0.82rem' }}
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>entries</span>
        </div>

        {/* Search */}
        <div className="position-relative" style={{ minWidth: '220px' }}>
          <Search
            className="position-absolute top-50 translate-middle-y text-muted"
            style={{ width: '13px', height: '13px', left: '9px' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="form-control form-control-sm rounded-3 shadow-none border ps-4"
            style={{ fontSize: '0.82rem' }}
          />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="table-responsive">
        <table className="table align-middle mb-0" style={{ fontSize: '0.88rem' }}>
          <thead
            className="table-light text-uppercase fw-bold text-muted"
            style={{ fontSize: '0.70rem' }}
          >
            <tr>
              <th className="ps-4" style={{ width: '48px' }}>#</th>
              {columns.map((col) => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-5 text-muted" style={{ fontSize: '0.88rem' }}>
                  {query ? `No results found for "${query}"` : 'No records available.'}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="border-bottom border-light">
                  {/* Row number */}
                  <td className="ps-4 text-muted" style={{ fontSize: '0.73rem' }}>
                    {startIdx + i + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="py-3">
                      {col.render
                        ? col.render(row, startIdx + i)
                        : (getCellText(row, col.key) || <span className="text-muted">—</span>)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: info text + pagination controls ───────────────────────── */}
      <div
        className="d-flex flex-wrap align-items-center justify-content-between gap-3 px-4 py-3 border-top"
        style={{ background: 'rgba(248,250,252,0.8)', fontSize: '0.80rem' }}
      >
        {/* Summary text */}
        <span className="text-muted">
          {filtered.length === 0
            ? 'No entries'
            : `Showing ${startIdx + 1}–${Math.min(startIdx + pageSize, filtered.length)} of ${filtered.length} entries`}
          {data.length !== filtered.length && ` (filtered from ${data.length} total)`}
        </span>

        {/* Pagination */}
        <nav aria-label="Table pagination">
          <ul className="pagination pagination-sm mb-0 gap-1">

            {/* ← Prev */}
            <li className={`page-item ${safePage <= 1 ? 'disabled' : ''}`}>
              <button className="page-link rounded-2 border-0 px-2" onClick={() => go(safePage - 1)} disabled={safePage <= 1}>
                <ChevronLeft style={{ width: '13px', height: '13px' }} />
              </button>
            </li>

            {/* First page + ellipsis */}
            {pageNums[0] > 1 && (
              <>
                <li className="page-item">
                  <button className="page-link rounded-2 border-0 px-2" onClick={() => go(1)}>1</button>
                </li>
                {pageNums[0] > 2 && (
                  <li className="page-item disabled"><span className="page-link border-0 px-2">…</span></li>
                )}
              </>
            )}

            {/* Window of page numbers */}
            {pageNums.map((n) => (
              <li key={n} className={`page-item ${n === safePage ? 'active' : ''}`}>
                <button
                  className="page-link rounded-2 border-0 px-2"
                  onClick={() => go(n)}
                  style={n === safePage ? { background: '#4f46e5', color: '#fff', fontWeight: 700 } : {}}
                >
                  {n}
                </button>
              </li>
            ))}

            {/* Ellipsis + last page */}
            {pageNums[pageNums.length - 1] < totalPages && (
              <>
                {pageNums[pageNums.length - 1] < totalPages - 1 && (
                  <li className="page-item disabled"><span className="page-link border-0 px-2">…</span></li>
                )}
                <li className="page-item">
                  <button className="page-link rounded-2 border-0 px-2" onClick={() => go(totalPages)}>{totalPages}</button>
                </li>
              </>
            )}

            {/* Next → */}
            <li className={`page-item ${safePage >= totalPages ? 'disabled' : ''}`}>
              <button className="page-link rounded-2 border-0 px-2" onClick={() => go(safePage + 1)} disabled={safePage >= totalPages}>
                <ChevronRight style={{ width: '13px', height: '13px' }} />
              </button>
            </li>

          </ul>
        </nav>
      </div>
    </div>
  );
}

export default GlobalDataTable;
