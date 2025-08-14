import * as React from "react";

const SimpleApp = () => {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, React.createElement('div', {
    style: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      textAlign: 'center'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { color: '#2563eb', margin: '0 0 20px 0' }
    }, '🏦 EasyCashFlows'),
    React.createElement('p', {
      key: 'subtitle',
      style: { color: '#64748b', margin: '0 0 20px 0' }
    }, 'Test Funzionamento Basilare'),
    React.createElement('button', {
      key: 'button',
      onClick: () => alert('React funziona!'),
      style: {
        background: '#2563eb',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer'
      }
    }, 'Test')
  ]));
};

export default SimpleApp;