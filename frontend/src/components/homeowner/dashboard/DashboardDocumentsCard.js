import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDocumentUrl } from '../../services/documentHelper';

function FileIcon({ fileType }) {
  let color = 'text-blue-500';
  if (fileType?.includes('pdf')) color = 'text-red-500';
  else if (fileType?.includes('image')) color = 'text-purple-500';
  else if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) color = 'text-green-500';

  return (
    <svg className={`h-5 w-5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export default function DashboardDocumentsCard({ documents, loadingDashboardData, currentProperty }) {
  const [viewingDoc, setViewingDoc] = useState(null);

  const Spinner = () => (
    <div className="text-center py-4">
      <svg className="animate-spin h-5 w-5 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="mt-2 t-secondary">Loading documents...</p>
    </div>
  );

  return (
    <>
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Documents</h2>
          <Link to="/documents" className="btn-secondary text-sm px-3 py-1 rounded-md">
            <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload
          </Link>
        </div>

        {loadingDashboardData ? <Spinner /> : documents.length > 0 ? (
          <div className="divide-y divide-gray-700">
            {documents.map(doc => (
              <div
                key={doc.id}
                className="py-3 flex items-center cursor-pointer hover:bg-black/10 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => setViewingDoc(doc)}
              >
                <div className="p-2 rounded bg-gray-700 mr-3">
                  <FileIcon fileType={doc.file_type} />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{doc.title}</h4>
                  <p className="text-xs t-secondary">
                    {doc.file_type ? doc.file_type.split('/')[1]?.toUpperCase() : 'DOC'}
                    {doc.created_at ? ` • Added ${new Date(doc.created_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <svg className="h-16 w-16 t-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="t-secondary mb-2">No documents added yet</p>
            <Link to="/documents" className="t-brand hover:opacity-80">Upload your first document</Link>
          </div>
        )}
      </div>

      {viewingDoc && (() => {
        const url = getDocumentUrl(viewingDoc, currentProperty?.id);
        const isImage = viewingDoc.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingDoc.url || '');
        const isPdf = viewingDoc.file_type === 'application/pdf' || /\.pdf$/i.test(viewingDoc.url || '');
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-75" onClick={() => setViewingDoc(null)} />
            <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col relative">
              <div className="flex justify-between items-center p-4 border-b border-themed flex-shrink-0">
                <h2 className="font-semibold t-primary truncate pr-4">{viewingDoc.title}</h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {url && <a href={url} download={viewingDoc.title} className="btn-secondary text-sm px-3 py-1 rounded-md">Download</a>}
                  <button onClick={() => setViewingDoc(null)} className="t-muted hover:t-primary">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
                {isImage ? (
                  <img src={url} alt={viewingDoc.title} className="max-w-full max-h-full object-contain rounded-lg" />
                ) : isPdf ? (
                  <iframe src={url} title={viewingDoc.title} className="w-full rounded-lg" style={{ height: '70vh' }} />
                ) : (
                  <div className="text-center py-12">
                    <svg className="h-16 w-16 t-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="t-secondary mb-4">Preview not available for this file type.</p>
                    {url && <a href={url} download={viewingDoc.title} className="btn-primary px-6 py-2 rounded-md">Download File</a>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
