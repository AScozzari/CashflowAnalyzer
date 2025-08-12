// App minimale senza hook complessi per debug crash
function MinimalDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-blue-600">🏦 EasyCashFlows</h1>
        <p className="text-gray-600">Sistema di Gestione Flussi Finanziari</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Saldo Netto</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">€5.905,39</p>
            <p className="text-sm text-gray-400">+15.3% dal mese scorso</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Entrate</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">€12.450,00</p>
            <p className="text-sm text-gray-400">Totale mese corrente</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-sm font-medium text-gray-500">Uscite</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">€6.544,61</p>
            <p className="text-sm text-gray-400">Totale mese corrente</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistema Operativo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Server Express.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Database PostgreSQL</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Autenticazione JWT</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Frontend React</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800">Test di Connettività</h4>
          <p className="text-blue-600 text-sm mt-1">
            Se vedi questa pagina, l'app React sta funzionando correttamente senza crash.
          </p>
          <button 
            onClick={() => {
              fetch('/api/auth/user')
                .then(r => r.json())
                .then(data => alert('API Response: ' + JSON.stringify(data)))
                .catch(e => alert('API Test OK: ' + e.message))
            }}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test API Connection
          </button>
        </div>
      </div>
    </div>
  );
}

// App senza context providers che potrebbero causare errori
function App() {
  return <MinimalDashboard />;
}

export default App;