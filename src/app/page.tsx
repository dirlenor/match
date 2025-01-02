export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <h1 className="text-h1 font-league-gothic text-text-light">Match</h1>
      <h2 className="text-h2 font-league-gothic text-accent mb-8">Check-in App</h2>
      
      <div className="w-full max-w-md space-y-4">
        <button className="btn w-full flex items-center justify-center">
          <i className="fas fa-clock mr-2"></i>
          Check-in
        </button>
        
        <button className="btn w-full flex items-center justify-center">
          <i className="fas fa-money-bill-wave mr-2"></i>
          Request Salary
        </button>
        
        <button className="btn w-full flex items-center justify-center">
          <i className="fas fa-history mr-2"></i>
          View History
        </button>
      </div>
    </main>
  )
}
