import Summary from '../pages/Summary';
import { checkSpecialAccess } from '../auth/authUtils';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  
  if (!user || !checkSpecialAccess(user.email)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

// ในส่วนของ Routes component
<Routes>
  {/* existing routes */}
  
  <Route 
    path="/summary" 
    element={
      <PrivateRoute>
        <Summary />
      </PrivateRoute>
    } 
  />
</Routes> 