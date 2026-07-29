import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProfilePage from "@/pages/Customer/ProfilePage";

export const profileRoute = [
  <Route key="profile" element={<ProtectedRoute allowedRoles={["admin", "support", "customer", "user"]} />}>
    <Route path="/profile" element={<ProfilePage />} />
  </Route>,
];
