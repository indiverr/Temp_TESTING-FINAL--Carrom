import React, { useState } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  Calendar,
  Download,
  Eye,
  Plus,
  ShieldCheck,
  FileText,
  X,
  CheckCircle,
  CheckCircle2,
} from 'lucide-react';
import { ResultPaperDocument, LoginType } from '../types';

interface ResultPaperScreenProps {
  papers: ResultPaperDocument[];
  currentRole: LoginType;
  businessDate: string;
  seriesTitle: string;
  onUploadPaper: (title: string, fileUrl: string) => void;
  onBack: () => void;
}

export const ResultPaperScreen: React.FC<ResultPaperScreenProps> = ({
  papers,
  currentRole,
  businessDate,
  seriesTitle,
  onUploadPaper,
  onBack,
}) => {
  const [selectedDate, setSelectedDate] = useState(businessDate);
  const [previewPaper, setPreviewPaper] = useState<ResultPaperDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const filteredPapers = papers.filter((p) => p.drawDate === selectedDate);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onUploadPaper(newTitle, '/assets/brand/anbu-aiot-logo.png');
    setIsUploadModalOpen(false);
    setNewTitle('');
  };

  const handleDownload = (paper: ResultPaperDocument) => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="w-full flex flex-col space-y-6 select-none">
      {/* 1. Page Heading */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 shadow-xs transition-all active:scale-95"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Official Result Papers & Scans
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                {seriesTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Certified document repository for printed lottery charts, declaration sheets, and scanned proofs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Draw Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="02 Oct 2026">02 Oct 2026</option>
              <option value="03 Oct 2026">03 Oct 2026</option>
              <option value="04 Oct 2026">04 Oct 2026</option>
            </select>
          </div>

          {currentRole === 'admin' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Published Documents
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block font-mono">
              {filteredPapers.length}
            </span>
            <span className="text-[11px] font-semibold text-blue-700 mt-0.5 block">
              Scanned sheets on file
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Document Format
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              PDF & High-Res Scans
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
              Cloud Storage backed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Public Ledger Access
            </span>
            <span className="text-lg font-black text-emerald-600 mt-1 block">
              Authorized & Signed
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 mt-0.5 block">
              Tamper-evident uploads
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Papers list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {filteredPapers.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-700">No Result Papers Uploaded</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Official printed result scans and declaration documents will be published here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/90 flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all"
              >
                <div className="flex items-start space-x-3.5 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                    <FileText className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">
                      {paper.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                      <span>{paper.fileSizeKb} KB</span>
                      <span>•</span>
                      <span>{paper.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Official Scan
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPreviewPaper(paper)}
                      className="px-2.5 py-1 rounded-xl text-blue-600 hover:bg-blue-50 active:scale-95 transition-all text-xs font-bold flex items-center space-x-1"
                      title="Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleDownload(paper)}
                      className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {previewPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[340px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-extrabold text-xs text-slate-900 truncate max-w-[220px]">
                {previewPaper.title}
              </span>
              <button onClick={() => setPreviewPaper(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center min-h-[220px]">
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">
                  Official Board Declaration Sheet
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Verified by {previewPaper.uploadedBy} on {previewPaper.drawDate}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDownload(previewPaper)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF ({previewPaper.fileSizeKb} KB)</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-[310px] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4 animate-in zoom-in-95">
            <div className="bg-blue-600 text-white rounded-2xl p-3 flex items-center justify-between mb-3 shadow-sm">
              <span className="font-black text-sm tracking-wide">Upload Result Paper</span>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-white">
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Document Title / Draw Notice:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Evening Result Sheet #02"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Select File:</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 bg-slate-50">
                  <span>Click to browse scan / PDF sheet</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md active:scale-95 transition-all"
              >
                Upload & Publish Result
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
