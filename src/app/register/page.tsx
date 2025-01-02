"use client";

export default function Register() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-16">
      <div className="text-center mb-16">
        <h1 className="text-[80px] sm:text-[120px] font-league-gothic text-text-light leading-none tracking-wide">MATCH</h1>
        <h2 className="text-[80px] sm:text-[120px] font-league-gothic text-text-light leading-none tracking-wide">TIME</h2>
        <p className="text-text-light mt-4 text-sm">Check in your time and request payment app.</p>
      </div>

      <div className="w-full max-w-[340px]">
        <form className="space-y-5">
          <div className="space-y-5">
            <div>
              <label className="block text-text-light mb-1.5 text-sm">Email</label>
              <input 
                type="email" 
                className="input w-full h-11"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-text-light mb-1.5 text-sm">Password</label>
              <input 
                type="password" 
                className="input w-full h-11"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-text-light mb-1.5 text-sm">Confirm Password</label>
              <input 
                type="password" 
                className="input w-full h-11"
                placeholder="Confirm your password"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="btn w-full h-11 group"
          >
            <i className="fas fa-arrow-right text-text-light group-hover:text-bg-dark"></i>
          </button>
        </form>

        <div className="text-center mt-4">
          <a href="/" className="text-text-light hover:text-accent text-sm">
            Already have an account? Login here
          </a>
        </div>
      </div>
    </main>
  );
} 