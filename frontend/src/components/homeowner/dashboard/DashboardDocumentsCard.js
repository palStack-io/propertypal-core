import React from 'react';
import { Link } from 'react-router-dom';

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

export default function DashboardDocumentsCard({ documents, loadingDashboardData }) {
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
            <div key={doc.id} className="py-3 flex items-center">
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
              <button className="ml-auto p-1.5 t-secondary hover:t-primary rounded-full hover:bg-gray-700">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
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
  );
}
