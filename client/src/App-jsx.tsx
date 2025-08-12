// Versione JSX semplificata
function App() {
  console.log("🎯 JSX App rendering...");
  
  const handleClick = () => {
    alert('🎉 JavaScript interattività funziona!');
    console.log('Button clicked successfully');
  };
  
  return (
    <div style={{ 
      padding: '40px', 
      background: 'linear-gradient(135deg, #667eea, #764ba2)', 
      minHeight: '100vh', 
      color: 'white', 
      fontFamily: 'Arial' 
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        🎯 EasyCashFlows WORKING
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
        Se vedi questo messaggio, React + JSX funziona al 100%!
      </p>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '10px' 
      }}>
        <h2>Status Check:</h2>
        <ul style={{ fontSize: '1.2rem', lineHeight: '2' }}>
          <li>✅ createRoot chiamato</li>
          <li>✅ JSX compilation funziona</li>
          <li>✅ Styling inline applicato</li>
          <li>✅ Event handlers pronti</li>
        </ul>
      </div>
      
      <button 
        style={{ 
          background: '#3b82f6', 
          color: 'white', 
          border: 'none', 
          padding: '15px 30px', 
          borderRadius: '8px', 
          fontSize: '1.2rem',
          cursor: 'pointer',
          marginTop: '20px'
        }}
        onClick={handleClick}
      >
        🚀 Test Interattività
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '1rem' }}>
        <p>🌐 Server: Operativo</p>
        <p>⚛️ React: Caricato</p>
        <p>🎨 Styling: Attivo</p>
      </div>
    </div>
  );
}

export default App;