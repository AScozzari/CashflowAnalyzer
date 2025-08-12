import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

// Componente di debug per identificare il problema
function DebugApp() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🔍 EasyCashFlows - Debug Mode</h1>
      <p>Se vedi questo messaggio, il problema non è in React base</p>
      
      <div style={{ marginTop: "20px", padding: "15px", background: "#f0f8ff", border: "1px solid #ccc" }}>
        <h2>Test Components:</h2>
        <button onClick={() => window.location.href = '/auth'}>
          Test Navigation to /auth
        </button>
      </div>
      
      <div style={{ marginTop: "20px" }}>
        <h3>Next: Test individual components step by step</h3>
        <ul>
          <li>✅ React + Wouter routing</li>
          <li>🔄 Testing QueryClient next...</li>
        </ul>
      </div>
    </div>
  );
}

function SimpleRouter() {
  return (
    <Switch>
      <Route path="/auth">
        <div style={{ padding: "20px" }}>
          <h2>🔐 Auth Page Debug</h2>
          <p>Auth route funziona!</p>
          <button onClick={() => window.location.href = '/'}>Back to Home</button>
        </div>
      </Route>
      <Route>
        <DebugApp />
      </Route>
    </Switch>
  );
}

function App() {
  console.log("🚀 App component loading...");
  
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleRouter />
    </QueryClientProvider>
  );
}

export default App;