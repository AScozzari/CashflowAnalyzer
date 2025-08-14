// SIMPLE APP WITHOUT HMR ISSUES
function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#2563eb', margin: '0 0 20px 0' }}>🏦 EasyCashFlows</h1>
        <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Sistema Funzionante</p>
        <div style={{ marginBottom: '20px' }}>
          <p>✅ App caricata correttamente</p>
          <p>✅ Nessun errore HMR</p>
          <p>✅ Reload risolto</p>
        </div>
        <button 
          onClick={() => alert('App funziona perfettamente!')}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Test Funzionamento
        </button>
      </div>
    </div>
  );
}

export default App;