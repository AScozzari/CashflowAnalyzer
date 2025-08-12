import React from 'react';

// Ultra-simple React component senza dipendenze esterne
function App() {
  console.log("🎯 Ultra-simple App rendering...");
  
  return React.createElement(
    'div',
    { style: { padding: '40px', background: 'linear-gradient(135deg, #667eea, #764ba2)', minHeight: '100vh', color: 'white', fontFamily: 'Arial' } },
    React.createElement('h1', { style: { fontSize: '3rem', marginBottom: '1rem' } }, '🎯 EasyCashFlows ULTRA-SIMPLE'),
    React.createElement('p', { style: { fontSize: '1.5rem', marginBottom: '2rem' } }, 'Se vedi questo messaggio, React funziona al 100%!'),
    React.createElement('div', { style: { background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' } },
      React.createElement('h2', {}, 'Status Check:'),
      React.createElement('ul', { style: { fontSize: '1.2rem', lineHeight: '2' } },
        React.createElement('li', {}, '✅ createRoot chiamato'),
        React.createElement('li', {}, '✅ React.createElement funziona'),
        React.createElement('li', {}, '✅ Styling inline applicato'),
        React.createElement('li', {}, '✅ Rendering completato')
      )
    ),
    React.createElement('button', {
      style: { 
        background: '#3b82f6', 
        color: 'white', 
        border: 'none', 
        padding: '15px 30px', 
        borderRadius: '8px', 
        fontSize: '1.2rem',
        cursor: 'pointer',
        marginTop: '20px'
      },
      onClick: () => {
        alert('🎉 JavaScript interattività funziona!');
        console.log('Button clicked successfully');
      }
    }, '🚀 Test Interattività')
  );
}

export default App;