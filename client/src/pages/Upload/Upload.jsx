import { useEffect, useRef, useState } from "react";
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Plus, Trash2, Save,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import PageHeader from "../../components/common/PageHeader";
import Badge from "../../components/common/Badge";
import api from "../../api/axios";

const blank = () => ({ date: "", orderId: "", customer: "", product: "", revenue: "", paymentResponsibility: "They need to pay", status: "Unpaid" });
const formatSize = (bytes) => (bytes ? `${(bytes / 1024 / 1024).toFixed(2)} MB` : "—");
const formatDate = (date) => new Date(date).toLocaleString();

function Upload() {
  const input = useRef();
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState("upload");
  const [history, setHistory] = useState([]);
  const [rows, setRows] = useState([blank(), blank()]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [recordRows, setRecordRows] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/datasets", auth);
      setHistory(response.data.datasets);
      setError("");
    } catch {
      setError("Could not load your uploaded datasets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [token]);

  const pick = (selectedFile) => {
    if (!selectedFile) return;
    if (!/\.csv$/i.test(selectedFile.name)) {
      setFile({ error: "Please choose a .csv file." });
      return;
    }
    setFile(selectedFile);
    setNotice("");
    setError("");
  };

  const downloadTemplate = () => {
    const csv = "date,order_id,customer,product,revenue,payment_responsibility,status\n2026-07-28,ORD-1001,Aarav Mehta,Enterprise plan,18500,They need to pay,Unpaid";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "aperture-data-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const processFile = async () => {
    if (!file || file.error || saving) return;
    setSaving(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await api.post("/datasets/upload", body, auth);
      setHistory((current) => [response.data.dataset, ...current]);
      setNotice(`${file.name} was saved and is ready for analysis.`);
      setFile(null);
      input.current.value = "";
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not upload the CSV file.");
    } finally {
      setSaving(false);
    }
  };

  const setCell = (index, key, value) => setRows(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const viewRecords = async (dataset) => {
    setSelectedDataset(dataset);
    setLoadingRecords(true);
    try {
      const response = await api.get(`/datasets/${dataset.id}/rows`, auth);
      setRecordRows(response.data.rows);
    } catch {
      setError("Could not load this dataset's records.");
      setSelectedDataset(null);
    } finally {
      setLoadingRecords(false);
    }
  };
  const downloadCsv = async (dataset) => {
    if (dataset.source !== "csv") {
      return setError("Only uploaded CSV datasets can be downloaded.");
    }
    setSaving(true);
    try {
      const response = await api.get(`/datasets/${dataset.id}/file`, { ...auth, responseType: "blob" });
      const url = URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = dataset.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download the CSV file. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const saveManual = async () => {
    const complete = rows.filter((row) => Object.values(row).every(Boolean));
    if (!complete.length) return setError("Add at least one complete row before saving.");
    setSaving(true);
    try {
      const name = `manual-entry-${new Date().toLocaleDateString("en-CA")}.csv`;
      const response = await api.post("/datasets/manual", { name, rows: complete }, auth);
      setHistory((current) => [response.data.dataset, ...current]);
      setNotice(`${complete.length} manual records were saved successfully.`);
      setRows([blank(), blank()]);
      setError("");
    } catch {
      setError("Could not save manual records. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader eyebrow="Data sources" title="Bring your data to life" description="Upload a CSV or enter records manually for immediate analysis." action={<div className="flex rounded-xl bg-slate-100 p-1"><button onClick={() => setMode("upload")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "upload" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Upload CSV</button><button onClick={() => setMode("manual")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${mode === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>Enter data</button></div>} />
      {notice && <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
      {error && <div className="mb-5 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}
      {mode === "upload" ? <section className="grid gap-5 xl:grid-cols-3"><article className="surface p-6 xl:col-span-2"><div onDragOver={(event) => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); pick(event.dataTransfer.files[0]); }} onClick={() => input.current.click()} className={`dropzone ${drag ? "dragging" : ""}`}><input ref={input} className="hidden" type="file" accept=".csv,text/csv" onChange={(event) => pick(event.target.files[0])} />{file?.error ? <AlertCircle className="mx-auto text-red-500" size={36} /> : file ? <CheckCircle2 className="mx-auto text-emerald-500" size={36} /> : <span className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-blue-100 text-blue-600"><UploadCloud size={27} /></span>}<h3 className="mt-4 font-bold">{file?.error ? "Upload needs attention" : file ? file.name : "Drop your CSV file here"}</h3><p className="mt-2 text-sm text-slate-500">{file?.error || file ? `${file.size ? formatSize(file.size) : ""} · Ready to process` : "or click to browse files from your computer"}</p><button className="mt-5 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white">{file ? "Choose another file" : "Select CSV file"}</button></div>{file && !file.error && <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm"><CheckCircle2 className="text-emerald-600" size={19} /><span><b>File validated.</b> Your dataset is ready for analysis.</span><button onClick={(event) => { event.stopPropagation(); processFile(); }} disabled={saving} className="ml-auto rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Process data"}</button></div>}</article><aside className="surface p-6"><h3 className="font-bold">Before you upload</h3><div className="mt-5 space-y-5 text-sm text-slate-600"><p><b className="block text-slate-900">Use a tidy CSV</b><span className="text-xs">One header row, consistent dates and amounts.</span></p><p><b className="block text-slate-900">Recommended columns</b><span className="text-xs">Date, order ID, customer, product, revenue, status.</span></p></div><button onClick={downloadTemplate} className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-600"><Download size={16} /> Download CSV template</button></aside></section> : <section className="surface p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Manual data entry</h3><p className="mt-1 text-xs text-slate-500">New entries are unpaid by default; update the status when payment is received.</p></div><button onClick={() => setRows([...rows, blank()])} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold"><Plus size={16} /> Add row</button></div><div className="table-wrap mt-5"><table className="data-table min-w-[960px]"><thead><tr><th>Date</th><th>Order ID</th><th>Customer</th><th>Product</th><th>Revenue (₹)</th><th>Payment responsibility</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{[["date", "date"], ["orderId", "text"], ["customer", "text"], ["product", "text"], ["revenue", "number"]].map(([key, type]) => <td key={key}><input type={type} value={row[key]} onChange={(event) => setCell(index, key, event.target.value)} className="form-input min-w-28 py-2 text-sm" /></td>)}<td><select value={row.paymentResponsibility} onChange={(event) => setCell(index, "paymentResponsibility", event.target.value)} className="form-input min-w-36 py-2 text-sm"><option>Customer owes me</option><option>I owe the customer</option><option>Split responsibility</option></select></td><td><select value={row.status} onChange={(event) => setCell(index, "status", event.target.value)} className="form-input min-w-24 py-2 text-sm"><option>Unpaid</option><option>Pending</option><option>Paid</option></select></td><td><button onClick={() => setRows(rows.length === 1 ? [blank()] : rows.filter((_, itemIndex) => itemIndex !== index))} className="icon-button text-red-500" aria-label="Remove row"><Trash2 size={16} /></button></td></tr>)}</tbody></table></div><div className="mt-5 flex justify-end"><button onClick={saveManual} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} /> {saving ? "Saving..." : "Save records"}</button></div></section>}
      <section className="surface mt-5"><div className="flex justify-between p-5"><div><h3 className="font-bold">Upload history</h3><p className="mt-1 text-xs text-slate-500">Your saved data sources</p></div></div>{loading ? <p className="px-5 pb-5 text-sm text-slate-500">Loading datasets...</p> : history.length === 0 ? <div className="px-5 pb-6 text-center text-sm text-slate-500"><FileSpreadsheet className="mx-auto mb-2 text-slate-400" size={28} />You have not uploaded any datasets yet.</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>File name</th><th>Size</th><th>Records</th><th>Uploaded</th><th>Status</th><th></th></tr></thead><tbody>{history.map((dataset) => <tr key={dataset.id}><td><span className="flex items-center gap-2 font-semibold"><FileSpreadsheet size={17} className="text-emerald-600" />{dataset.name}</span></td><td>{formatSize(dataset.fileSize)}</td><td>{dataset.rowCount.toLocaleString()} rows</td><td>{formatDate(dataset.createdAt)}</td><td><Badge tone="green">Processed</Badge></td><td className="space-x-2"><button onClick={() => viewRecords(dataset)} className="text-xs font-bold text-blue-600">View records</button><button onClick={() => downloadCsv(dataset)} className="text-xs font-semibold text-slate-500">Download CSV</button></td></tr>)}</tbody></table></div>}</section>
      {selectedDataset && <section className="surface mt-5 p-5"><div className="flex items-center justify-between"><div><h3 className="font-bold">{selectedDataset.name}</h3><p className="mt-1 text-xs text-slate-500">Saved records — available after logout, restart, and redeploy.</p></div><button onClick={() => setSelectedDataset(null)} className="text-sm font-semibold text-slate-500">Close</button></div>{loadingRecords ? <p className="mt-4 text-sm text-slate-500">Loading records...</p> : <div className="table-wrap mt-4"><table className="data-table"><thead><tr><th>#</th>{selectedDataset.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{recordRows.map((record) => <tr key={record.rowNumber}><td>{record.rowNumber}</td>{selectedDataset.headers.map((header) => <td key={header}>{record.data[header]}</td>)}</tr>)}</tbody></table></div>}</section>}
    </DashboardLayout>
  );
}

export default Upload;
