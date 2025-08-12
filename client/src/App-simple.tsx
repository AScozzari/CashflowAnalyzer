import { Switch, Route } from "wouter";

// Componente di test ultraminimo
function SimpleTest() {
  return (
    <div className="p-8 bg-blue-50 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-800">✅ EasyCashFlows FUNZIONA!</h1>
      <p className="text-lg mt-4">Se vedi questo messaggio, React si carica correttamente!</p>
      <div className="mt-8 p-4 bg-white rounded border">
        <h2 className="text-xl font-semibold">Test completato:</h2>
        <ul className="mt-2 space-y-1">
          <li>✅ Server attivo</li>
          <li>✅ React caricato</li>
          <li>✅ CSS Tailwind funzionante</li>
          <li>✅ Routing wouter operativo</li>
        </ul>
      </div>
      <div className="mt-6">
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => alert('Click handler funziona!')}
        >
          Test Interattività
        </button>
      </div>
    </div>
  );
}

function SimpleAuth() {
  return (
    <div className="p-8 bg-green-50 min-h-screen">
      <h1 className="text-2xl font-bold text-green-800">🔐 Login Page Test</h1>
      <p>Questa è la pagina di login semplificata</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={SimpleAuth} />
      <Route component={SimpleTest} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;