import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../layout/Navigation';
import documentService from '../services/DocumentService';
import { apiHelpers } from '../../services/api';
import { getDocumentUrl } from '../services/documentHelper';

const Documents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentProperty, setCurrentProperty] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'insurance',
    property_id: '',
    file: null
  });

  // Fetch property documents - wrapped in useCallback
  const fetchPropertyDocuments = useCallback(async (propertyId) => {
    try {
      setLoading(true);
      const data = await documentService.getAllDocuments(propertyId);
      setDocuments(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching property documents:', err);
      setError('Failed to load property documents. Please try again later.');
      setLoading(false);
    }
  }, []);

  // Get current user from local storage
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (!userString || !token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userString));

    // Get current property from localStorage
    const fetchProperties = async () => {
      try {
        // Using apiHelpers instead of fetch
        const fetchedProperties = await apiHelpers.get('properties/');

        if (fetchedProperties.length > 0) {
          // Get current property from localStorage or use the first one
          const savedPropertyId = localStorage.getItem('currentPropertyId');
          let propertyToUse;

          if (savedPropertyId) {
            propertyToUse = fetchedProperties.find(p => p.id.toString() === savedPropertyId);
          }

          // If no saved property or saved property not found, use first property
          if (!propertyToUse) {
            propertyToUse = fetchedProperties[0];
          }

          setCurrentProperty(propertyToUse);

          // Fetch documents for the selected property
          if (propertyToUse) {
            fetchPropertyDocuments(propertyToUse.id);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property information. Please try again later.');
        setLoading(false);
      }
    };

    fetchProperties();
  }, [navigate, fetchPropertyDocuments]);

  // Handle property selection from dropdown
  const handleSelectProperty = useCallback((property) => {
    setCurrentProperty(property);

    // Save to localStorage
    localStorage.setItem('currentPropertyId', property.id);

    // Fetch documents for the selected property
    fetchPropertyDocuments(property.id);
  }, [fetchPropertyDocuments]);

  // Filter documents based on current filter
  const getFilteredDocuments = () => {
    let docsToFilter = documents;

    // Filter by category if filter is not 'all'
    if (filter !== 'all') {
      docsToFilter = docsToFilter.filter(doc => doc.category === filter);
    }

    // Filter by search term if present
    if (searchTerm) {
      docsToFilter = docsToFilter.filter(doc =>
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return docsToFilter;
  };

  const filteredDocuments = getFilteredDocuments();

  // Handle file upload with size validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file && file.size > 200 * 1024 * 1024) { // 200MB limit
      setError('File size exceeds the maximum limit of 200MB');
      return;
    }

    setUploadData({
      ...uploadData,
      file: file
    });
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUploadData({
      ...uploadData,
      [name]: value
    });
  };

  // Handle document upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadData.file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setLoading(true);

      // Create form data
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('category', uploadData.category);

      // Upload to property documents
      if (currentProperty) {
        formData.append('property_id', currentProperty.id);
      }

      // Special handling for property photos
      if (uploadData.category === 'property_photo') {
        formData.append('is_photo', 'true');
        await documentService.uploadDocument(formData);
      } else {
        // Regular document upload
        await documentService.uploadDocument(formData);
      }

      // Reload property documents
      if (currentProperty) {
        await fetchPropertyDocuments(currentProperty.id);
      }

      // Reset form and close modal
      setUploadData({
        title: '',
        description: '',
        category: 'insurance',
        property_id: '',
        file: null
      });

      setUploadModalOpen(false);
      setMessage('Document uploaded successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again later.');
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = async (doc) => {
    try {
      setLoading(true);

      // Check if document has the url property
      if (doc.url) {
        // Get document URL using the helper
        const documentUrl = getDocumentUrl(doc, currentProperty?.id);

        // Create temporary link for download
        const link = document.createElement('a');
        link.href = documentUrl;
        link.setAttribute('download', doc.title || 'document');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMessage('Document downloaded successfully!');
        setLoading(false);
      } else {
        // Fallback for documents without url property
        const url = await documentService.downloadDocument(doc.id);

        // Create temporary link for download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.title || 'document');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setLoading(false);
      }
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again later.');
      setLoading(false);
    }
  };

  // Handle document deletion
  const handleDelete = async (doc) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        setLoading(true);

        if (doc.category === 'property_photo') {
          // Use property photo deletion endpoint if available
          await documentService.deleteDocument(doc.id);
          setMessage('Property photo deleted successfully!');
        } else {
          // Delete regular property document
          await documentService.deleteDocument(doc.id);
          setMessage('Document deleted successfully!');
        }

        // Reload property documents
        if (currentProperty) {
          await fetchPropertyDocuments(currentProperty.id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error deleting document:', err);
        setError('Failed to delete document. Please try again later.');
        setLoading(false);
      }
    }
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return (
        <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (fileType?.includes('image')) {
      return (
        <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (fileType?.includes('excel') || fileType?.includes('spreadsheet')) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else if (fileType?.includes('word') || fileType?.includes('document')) {
      return (
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    }
  };

  return (
    <Navigation user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-gray-400 mt-1">Manage all your property documents</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <button
              className="btn-secondary text-sm px-4 py-2 rounded-md flex items-center"
              onClick={() => {
                setUploadData({
                  ...uploadData,
                  category: 'insurance'
                });
                setUploadModalOpen(true);
              }}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Upload Document
            </button>
          </div>
        </div>

        {/* Error and message display */}
        {error && (
          <div className="bg-red-900 bg-opacity-30 text-red-400 p-4 rounded-md mb-6">
            {error}
            <button
              className="float-right text-red-400 hover:text-red-300"
              onClick={() => setError('')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}

        {message && (
          <div className="bg-green-900 bg-opacity-30 text-green-400 p-4 rounded-md mb-6">
            {message}
            <button
              className="float-right text-green-400 hover:text-green-300"
              onClick={() => setMessage('')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        )}

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div className="flex overflow-x-auto pb-2 mb-4 md:mb-0">
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('all')}
            >
              All Documents
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'property_photo' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('property_photo')}
            >
              Property Photos
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'insurance' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('insurance')}
            >
              Insurance
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'legal' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('legal')}
            >
              Legal
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'financial' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('financial')}
            >
              Financial
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'maintenance' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('maintenance')}
            >
              Maintenance
            </button>
            <button
              className={`mr-2 px-4 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'other' ? 'bg-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setFilter('other')}
            >
              Other
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              className="form-input w-full md:w-64 py-2 pl-10"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {/* Document list */}
        {loading ? (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-3 text-gray-400">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16 card">
            <svg className="h-16 w-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm
                ? `No results for "${searchTerm}"`
                : filter !== 'all'
                  ? `No ${filter} documents found`
                  : 'You have not added any documents yet'}
            </p>
            <button
              className="btn-secondary px-4 py-2 rounded-md"
              onClick={() => {
                setUploadData({
                  ...uploadData,
                  category: 'insurance'
                });
                setUploadModalOpen(true);
              }}
            >
              Upload Your First Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 rounded bg-gray-700 mr-3">
                      {getFileIcon(doc.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-lg truncate">{doc.title}</h3>
                      <p className="text-xs text-gray-400 truncate">{doc.description}</p>

                      {/* Show property photo badge */}
                      {doc.category === 'property_photo' && (
                        <div className="mt-1 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-purple-900 bg-opacity-20 text-purple-400">
                            Property Photo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>{doc.file_type ? doc.file_type.split('/')[1]?.toUpperCase() : 'DOC'}</span>
                    <span>{doc.file_size ? formatFileSize(doc.file_size) : 'Unknown size'}</span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-700">
                      {doc.category ? doc.category.charAt(0).toUpperCase() + doc.category.slice(1).replace('_', ' ') : 'Other'}
                    </span>
                  </div>

                  <div className="flex justify-between mt-4">
                    {/* Use the URL directly if available */}
                    {doc.url ? (
                      <a
                        href={getDocumentUrl(doc, currentProperty?.id)}
                        className="text-secondary hover:text-secondary-light text-sm"
                        download={doc.title}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    ) : (
                      <button
                        className="text-secondary hover:text-secondary-light text-sm"
                        onClick={() => handleDownload(doc)}
                      >
                        Download
                      </button>
                    )}

                    <button
                      className="text-red-500 hover:text-red-400 text-sm"
                      onClick={() => handleDelete(doc)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setUploadModalOpen(false)}></div>
              <div className="card w-full max-w-md p-6 relative">
                <h2 className="text-xl font-semibold mb-6">Upload Property Document</h2>

                <form onSubmit={handleUpload}>
                  <div className="mb-4">
                    <label className="form-label">Document Title*</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      value={uploadData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      className="form-input"
                      value={uploadData.description}
                      onChange={handleInputChange}
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Category*</label>
                    <select
                      name="category"
                      className="form-input"
                      value={uploadData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="property_photo">Property Photo</option>
                      <option value="insurance">Insurance</option>
                      <option value="legal">Legal</option>
                      <option value="financial">Financial</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="form-label">Document File*</label>
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-600 rounded-md p-6">
                      {uploadData.file ? (
                        <div className="text-center">
                          <p className="text-sm text-gray-300">{uploadData.file.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatFileSize(uploadData.file.size)}</p>
                          <button
                            type="button"
                            className="text-xs text-red-500 mt-2"
                            onClick={() => setUploadData({...uploadData, file: null})}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="h-12 w-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                          </svg>
                          <p className="text-sm text-gray-400 mb-2">Drag and drop a file or</p>
                          <label className="btn-secondary text-xs px-3 py-1 rounded-md cursor-pointer">
                            Browse Files
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {uploadData.category === 'property_photo' && (
                      <p className="text-xs text-gray-400 mt-2">
                        Note: Property photos will be stored in a special location and displayed in your property gallery.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-300 px-4 py-2 mr-2"
                      onClick={() => setUploadModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-secondary px-4 py-2 rounded-md"
                      disabled={loading || !uploadData.file || !uploadData.title}
                    >
                      {loading ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
};

export default Documents;
