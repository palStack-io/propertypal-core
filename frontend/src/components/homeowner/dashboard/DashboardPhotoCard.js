import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DashboardPhotoCard({
  currentProperty,
  homePhotos,
  uploadingPhoto,
  fileInputRef,
  handleFileSelect,
  triggerFileInput,
  openCamera,
  setAsPrimary,
  deletePhoto,
}) {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <>
      <div className="card mb-8 overflow-hidden">
        <div className="relative">
          <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
            {homePhotos.length > 0 ? (
              <div className="relative w-full h-full">
                <div className="fallback-house absolute inset-0 flex flex-col items-center justify-center bg-gray-800 rounded-lg">
                  <svg className="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <p className="mt-4 text-white text-lg font-medium">
                    {currentProperty?.address || 'Your Home'}
                  </p>
                  {currentProperty && (
                    <p className="text-gray-300 text-sm">
                      {currentProperty.city}, {currentProperty.state}
                    </p>
                  )}
                </div>
                <img
                  src={homePhotos.find(p => p.is_primary)?.url || homePhotos[0].url}
                  alt="Home Exterior"
                  className="home-image-main w-full h-full object-cover hidden"
                  onLoad={(e) => {
                    e.target.classList.remove('hidden');
                    const fallback = e.target.parentNode.querySelector('.fallback-house');
                    if (fallback) fallback.style.display = 'none';
                  }}
                  onError={(e) => { e.target.onerror = null; }}
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg className="h-16 w-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <button
                  className="btn-secondary text-sm px-6 py-2 rounded-md flex items-center"
                  onClick={triggerFileInput}
                  disabled={uploadingPhoto || !currentProperty}
                >
                  {uploadingPhoto ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                      </svg>
                      Upload Home Photo
                    </>
                  )}
                </button>
                {!currentProperty && (
                  <p className="text-sm text-red-400 mt-2">Please set up your property first</p>
                )}
                {currentProperty && (
                  <p className="text-sm text-gray-400 mt-2">Upload an image of your home (JPEG, PNG, max 5MB)</p>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg, image/png, image/gif"
                  onChange={handleFileSelect}
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-card-bg rounded-b-lg flex justify-between items-center">
          <div>
            <h3 className="font-medium">Home Exterior</h3>
            <p className="text-sm text-gray-400">
              {homePhotos.length > 0
                ? `Last updated: ${new Date(homePhotos[0].created_at).toLocaleDateString()}`
                : 'Last updated: Never'}
            </p>
          </div>
          <div>
            <button
              className={`t-brand text-sm hover:opacity-80 mr-4 ${homePhotos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setShowGallery(true)}
              disabled={homePhotos.length === 0}
            >
              View Gallery
            </button>
            <button
              className="btn-accent text-sm px-3 py-1 rounded-md"
              onClick={openCamera}
              disabled={!currentProperty}
            >
              <svg className="h-4 w-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setShowGallery(false)} />
            <div className="card w-full max-w-4xl p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Home Photo Gallery</h2>
                <button className="t-secondary hover:t-primary rounded-full p-1" onClick={() => setShowGallery(false)}>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {homePhotos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="t-secondary">No photos available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {homePhotos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.title || 'Home'}
                        className={`w-full h-48 object-cover rounded-md ${photo.is_primary ? 'ring-2 ring-sky-400' : ''}`}
                        onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center space-x-2">
                        {!photo.is_primary && (
                          <button
                            className="text-white p-2 bg-sky-500 rounded-full"
                            onClick={() => setAsPrimary(photo.id)}
                            title="Set as primary photo"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          className="text-white p-2 bg-red-600 rounded-full"
                          onClick={() => deletePhoto(photo.id)}
                          title="Delete photo"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      {photo.is_primary && (
                        <div className="absolute top-2 right-2 bg-sky-400 text-white text-xs px-2 py-1 rounded-full">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <label className="btn-secondary px-4 py-2 rounded-md flex items-center mx-auto cursor-pointer w-fit">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add More Photos
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg, image/png, image/gif"
                    onChange={handleFileSelect}
                    disabled={!currentProperty}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
