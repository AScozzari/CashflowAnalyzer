// App minimo senza dipendenze esterne
function App() {
  return (
    <div style={{ padding: "20px", backgroundColor: "#f0f8ff", minHeight: "100vh" }}>
      <h1 style={{ color: "#2563eb", fontSize: "2rem" }}>
        🎯 EasyCashFlows Test Minimo
      </h1>
      <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
        Se vedi questo, React funziona correttamente!
      </p>
      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "white", border: "1px solid #ccc" }}>
        <h2>Status Check:</h2>
        <ul>
          <li>✅ React rendering</li>
          <li>✅ JavaScript attivo</li>
          <li>✅ DOM manipulation</li>
        </ul>
      </div>
    </div>
  );
}

export default App;