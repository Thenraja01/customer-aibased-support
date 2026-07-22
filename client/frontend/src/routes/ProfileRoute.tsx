import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProdectedRoute";
import ProfilePage from "@/pages/Customer/ProfilePage";

export const profileRoute = [
  <Route key="profile" element={<ProtectedRoute allowedRoles={["super_admin", "admin", "support", "customer", "user"]} />}>
    <Route path="/profile" element={<ProfilePage />} />
  </Route>,
];
