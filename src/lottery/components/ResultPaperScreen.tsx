import React, { useState } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  Calendar,
  Download,
  Eye,
  Plus,
  FileText,
  X,
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

  const filteredPapers = papers.filter((p) => p.drawDate === selectedDate);

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onUploadPaper(newTitle, '/assets/brand/anbu-aiot-logo.png');
    setIsUploadModalOpen(false);
    setNewTitle('');
  };

  return (
    <div className="w-full flex flex-col space-y-5 select-none">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Result Sheets
              </h1>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {seriesTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Published draw result charts and scanned sheets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="02 Oct 2026">02 Oct 2026</option>
              <option value="03 Oct 2026">03 Oct 2026</option>
              <option value="04 Oct 2026">04 Oct 2026</option>
            </select>
          </div>

          {currentRole === 'admin' && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Sheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Papers Grid */}
      <div>
        {filteredPapers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center space-y-1.5">
            <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No Result Sheets Uploaded</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Result documents for {selectedDate} will appear here once uploaded.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-xl p-5 shadow-2xs border border-slate-200 flex flex-col justify-between"
              >
                <div className="flex items-start space-x-3.5 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                      {paper.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span>{paper.fileSizeKb} KB</span>
                      <span>•</span>
                      <span>{paper.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Result Sheet
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPreviewPaper(paper)}
                      className="px-2.5 py-1 rounded-md text-slate-700 hover:bg-slate-100 transition-colors text-xs font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900 truncate max-w-[240px]">
                {previewPaper.title}
              </span>
              <button onClick={() => setPreviewPaper(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 p-6 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center min-h-[180px]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-2.5">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 block">
                  Draw Result Sheet
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Uploaded by {previewPaper.uploadedBy} • {previewPaper.drawDate}
                </span>
              </div>
            </div>

            <button
              onClick={() => setPreviewPaper(null)}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF ({previewPaper.fileSizeKb} KB)</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-lg overflow-hidden border border-slate-200 p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Upload Result Sheet</span>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title:
                </label>
                <input
                  type="text"
                  placeholder="Evening Draw Result Sheet"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">File:</label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center text-xs text-slate-500 bg-slate-50">
                  <span>Select PDF or image file</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
              >
                Upload Sheet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
