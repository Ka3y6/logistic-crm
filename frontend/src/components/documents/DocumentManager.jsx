// components/documents/DocumentManager.jsx
const DocumentManager = ({ documents }) => {
  return (
    <div className="document-manager">
      <div className="upload-section">
        <input type="file" onChange={handleFileUpload} />
        <button onClick={handleSignAll}>Подписать все</button>
      </div>
      
      <div className="document-list">
        {documents.map(doc => (
          <div key={doc.id} className="document-item">
            <span>{doc.name}</span>
            <button 
              onClick={() => handleSign(doc.id)}
              disabled={doc.isSigned}
            >
              {doc.isSigned ? 'Подписано' : 'Подписать ЭЦП'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};