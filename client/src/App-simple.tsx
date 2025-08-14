import React from "react";

console.log('[APP-SIMPLE] Minimal test component loading...');

export default function App() {
  console.log('[APP-SIMPLE] Rendering minimal test...');
  
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
        <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>Test minimo funzionante</p>
        <div style={{ marginBottom: '20px' }}>
          <p>✅ React caricato</p>
          <p>✅ Componente renderizzato</p>
          <p>✅ Vite funzionante</p>
        </div>
        <button 
          onClick={() => {
            console.log('[TEST] Button clicked');
            alert('React funziona!');
          }}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          Test React
        </button>
        <button 
          onClick={() => window.location.href = '/?app=full'}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          App Completa
        </button>
      </div>
    </div>
  );
}