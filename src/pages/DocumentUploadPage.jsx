import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplicants, addApplicant, deleteApplicant, addDocument, deleteDocument, uploadDocumentFile, removeDocumentFile } from '../api/auth';

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeDocId, setActiveDocId] = useState(null); // selected doc for upload
  const [uploadState, setUploadState] = useState('idle'); // 'idle'|'choosing'|'uploading'
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/'); return; }
    getApplicants().then(({ data }) => {
      setApplicants(data);
      setActiveIndex(0);
      if (data[0]?.documents?.length > 0) setActiveDocId(data[0].documents[0].docId);
    }).catch(() => navigate('/'));
  }, [navigate]);

  const activeApplicant = applicants[activeIndex];

  // Auto-select first doc whenever active applicant changes
  useEffect(() => {
    if (activeApplicant?.documents?.length > 0 && !activeDocId) {
      setActiveDocId(activeApplicant.documents[0].docId);
    }
  }, [activeApplicant, activeDocId]);

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const { data } = await addApplicant(newName.trim());
      setApplicants(data); setActiveIndex(data.length - 1);
      setNewName(''); setShowAddApplicant(false);
    } finally { setLoading(false); }
  };

  const handleDeleteApplicant = async (applicantId) => {
    const { data } = await deleteApplicant(applicantId);
    setApplicants(data); setActiveIndex(0); setActiveDocId(null);
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.trim() || !activeApplicant) return;
    setLoading(true);
    try {
      const { data } = await addDocument(activeApplicant.applicantId, newDoc.trim());
      setApplicants(data);
      const updated = data[activeIndex];
      const firstDoc = updated.documents[0];
      setActiveDocId(firstDoc ? firstDoc.docId : null);
      setUploadState('choosing');
      setNewDoc(''); setShowAddDoc(false);
    } finally { setLoading(false); }
  };

  const handleDeleteDocument = async (docId) => {
    const { data } = await deleteDocument(activeApplicant.applicantId, docId);
    setApplicants(data);
    if (activeDocId === docId) { setActiveDocId(null); setUploadState('idle'); setSelectedFile(null); }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadState('choosing');
  };

  const handleUpload = async () => {
    if (!selectedFile || !activeApplicant || !activeDocId) return;
    setUploadState('uploading'); setProgress(0);
    try {
      const { data } = await uploadDocumentFile(activeApplicant.applicantId, activeDocId, selectedFile, setProgress);
      setApplicants(data);
      setUploadState('idle'); setSelectedFile(null);
    } catch (err) {
      setUploadState('choosing');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setActiveDocId(null);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const switchApplicant = (index) => {
    setActiveIndex(index);
    setSelectedFile(null);
    setUploadState('idle');
    const firstDoc = applicants[index]?.documents?.[0];
    setActiveDocId(firstDoc ? firstDoc.docId : null);
  };

  const goBack = () => { if (activeIndex > 0) switchApplicant(activeIndex - 1); };
  const goNext = () => { if (activeIndex < applicants.length - 1) switchApplicant(activeIndex + 1); };

  const selectDoc = (docId) => {
    setActiveDocId(docId);
    setUploadState('choosing');
    setSelectedFile(null);
  };

  return (
    <div className="bg-white flex flex-col p-4 sm:p-8" style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-2 sm:px-8 py-4 sm:py-5 mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">Document Upload</h1>
        <button onClick={() => setShowAddApplicant(true)}
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white whitespace-nowrap"
          style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 0 2px #93c5fd' }}>
          + Add Applicant
        </button>
      </div>

      {/* ── Applicant Tabs ── */}
      {applicants.length > 0 && (
        <div style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center px-2 sm:px-8 pt-4 sm:pt-5 gap-3 overflow-x-auto">
            {applicants.map((a, i) => (
              <div key={a.applicantId} className="flex items-center gap-2 flex-shrink-0"
                style={{ borderBottom: activeIndex === i ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: '-1px' }}>
                <button onClick={() => switchApplicant(i)}
                  className="text-sm sm:text-base font-semibold pb-2 transition-colors"
                  style={{ color: activeIndex === i ? '#3b82f6' : '#9ca3af' }}>
                  {a.name}
                </button>
                <button onClick={() => handleDeleteApplicant(a.applicantId)}
                  className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-white mb-2"
                  style={{ backgroundColor: '#3b82f6' }}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Documents Area ── */}
      {activeApplicant && (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 px-2 sm:px-8 py-4 sm:py-6">
          {/* Doc list — horizontal scroll on mobile, vertical on desktop */}
          <div className="flex flex-row sm:flex-col gap-3 sm:gap-6 overflow-x-auto pb-1 sm:pb-0 sm:min-w-[160px]">
            {activeApplicant.documents.map((doc) => (
              <button
                key={doc.docId}
                onClick={() => selectDoc(doc.docId)}
                className="px-4 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white transition-all text-left flex-shrink-0"
                style={{
                  backgroundColor: '#3b82f6',
                  boxShadow: activeDocId === doc.docId ? '0 0 0 2px #93c5fd' : 'none',
                  minWidth: 110,
                }}
              >
                {doc.name}
              </button>
            ))}

            <button onClick={() => setShowAddDoc(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 0 2px #93c5fd', minWidth: 90 }}>
              + Add
            </button>
          </div>

          {/* Right — upload panel */}
          {activeDocId && (
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
              {/* Action buttons — always visible */}
              {(() => {
                const currentDoc = activeApplicant.documents.find(d => d.docId === activeDocId);
                const uploaded = !!currentDoc?.fileUrl;
                return (
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-200 flex-wrap">
                    <button onClick={() => !uploaded && fileInputRef.current.click()}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white"
                      style={{ backgroundColor: '#3b82f6', boxShadow: '0 0 0 2px #93c5fd', opacity: uploaded ? 0.5 : 1 }}>
                      + Choose
                    </button>
                    <button onClick={handleUpload} disabled={!selectedFile || uploadState === 'uploading' || uploaded}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white"
                      style={{ backgroundColor: '#3b82f6', opacity: (!selectedFile || uploaded) ? 0.5 : 1 }}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {uploadState === 'uploading' ? `${progress}%` : 'Upload'}
                    </button>
                    <button onClick={handleCancel} disabled={uploaded}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white"
                      style={{ backgroundColor: '#3b82f6', opacity: uploaded ? 0.5 : 1 }}>
                      × Cancel
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files[0])} />
                  </div>
                );
              })()}

              {/* File zone */}
              {(() => {
                const currentDoc = activeApplicant.documents.find(d => d.docId === activeDocId);
                const isImage = (name) => /\.(jpg|jpeg|png|gif|webp)$/i.test(name);

                if (currentDoc?.fileUrl) {
                  return (
                    <div className="px-5 py-6">
                      <div className="flex items-center gap-4 px-2 py-3">
                        {isImage(currentDoc.fileName) ? (
                          <img src={currentDoc.fileUrl} alt="" className="w-14 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-700 truncate">{currentDoc.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#22c55e' }}>Completed</span>
                          </div>
                        </div>
                        <button onClick={async () => { const { data } = await removeDocumentFile(activeApplicant.applicantId, currentDoc.docId); setApplicants(data); setSelectedFile(null); setUploadState('choosing'); }} className="text-red-400 hover:text-red-600 ml-4">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                }

                if (selectedFile) {
                  return (
                    <div className="px-5 py-6">
                      <div className="flex items-center gap-4 border border-gray-100 rounded-lg px-4 py-4">
                        {isImage(selectedFile.name) ? (
                          <img src={URL.createObjectURL(selectedFile)} alt="" className="w-14 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-700 truncate">{selectedFile.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(3)} KB</p>
                            <span className="px-3 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: '#f97316' }}>Pending</span>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedFile(null); }} className="text-red-400 hover:text-red-600 ml-2">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {uploadState === 'uploading' && (
                        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                  );
                }

                // Empty — drag & drop
                return (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className="flex items-center justify-center px-6 cursor-pointer transition-colors"
                    style={{ backgroundColor: dragging ? '#eff6ff' : '#fff', minHeight: 160 }}
                    onClick={() => fileInputRef.current.click()}
                  >
                    <p className="text-gray-400 text-base">Drag and Drop files here.</p>
                  </div>
                );
              })()}

            </div>
          )}

          {/* No doc selected yet */}
          {!activeDocId && activeApplicant.documents.length === 0 && (
            <div className="flex items-center text-gray-400 text-base">No documents yet. Click "+ Add" to create one.</div>
          )}
        </div>
      )}

      {/* ── Back / Next ── */}
      <div className="flex items-center justify-between px-2 sm:px-8 py-4 mt-4 sm:mt-8">
        <button onClick={goBack} disabled={activeIndex === 0}
          className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <button onClick={goNext} disabled={activeIndex >= applicants.length - 1}
          className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}>
          Next
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* ── Bottom Divider ── */}
      <div className="h-px bg-gray-200" />

      {/* ── Add Applicant Modal ── */}
      {showAddApplicant && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-2xl font-bold text-gray-800">Add Applicant</h2>
              <button onClick={() => { setShowAddApplicant(false); setNewName(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddApplicant}>
              <label className="block text-base text-gray-600 mb-2">Name</label>
              <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-base text-gray-800 focus:outline-none mb-8" />
              <div className="flex gap-3 justify-end">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold text-white"
                  style={{ backgroundColor: '#3b82f6' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Save
                </button>
                <button type="button" onClick={() => { setShowAddApplicant(false); setNewName(''); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold text-white bg-gray-500 hover:bg-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Document Modal ── */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-2xl font-bold text-gray-800">Add</h2>
              <button onClick={() => { setShowAddDoc(false); setNewDoc(''); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddDocument}>
              <label className="block text-base text-gray-600 mb-2">Document Name</label>
              <input autoFocus type="text" value={newDoc} onChange={(e) => setNewDoc(e.target.value)}
                placeholder="e.g. Passport, Resume"
                className="w-full px-4 py-3 border-2 border-blue-500 rounded-lg text-base text-gray-800 focus:outline-none mb-8" />
              <div className="flex gap-3 justify-end">
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold text-white"
                  style={{ backgroundColor: '#3b82f6' }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Save
                </button>
                <button type="button" onClick={() => { setShowAddDoc(false); setNewDoc(''); }}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-base font-semibold text-white bg-gray-500 hover:bg-gray-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
