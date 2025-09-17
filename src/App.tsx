import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import DoctorLogin from "./pages/auth/DoctorLogin";
import DoctorDashboard from "./pages/doctor/Dashboard";
import History from "./pages/doctor/prescriptions/History";
import Detail from "./pages/doctor/prescriptions/Detail";
import NewPrescription from "./pages/doctor/prescriptions/NewPrescription";
import Patients from "./pages/doctor/Patients";
import PatientLogin from "./pages/auth/PatientLogin";
import Logout from "./pages/auth/Logout";
import Register from "./pages/auth/Register";
import PatientDashboard from "./pages/patient/Dashboard";
import PrescriptionDetailPatient from "./pages/patient/PrescriptionDetail";
import PatientNotifications from "./pages/patient/Notification";
import PharmacyDashboard from "./pages/pharmacy/Dashaboard";
import PharmacyVerify from "./pages/pharmacy/Verify";
import DispensedHistory from "./pages/pharmacy/DispensedHistory";
import PharmacyLogin from "./pages/auth/PharmacyLogin";
import PatientPrescriptionQR from "./pages/patient/PatientPrescriptionQR";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login/doctor" element={<DoctorLogin />} />
          <Route path="/login/patient" element={<PatientLogin />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login/pharmacy" element={<PharmacyLogin />} />

          {/* Médico */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute role="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescriptions"
            element={
              <ProtectedRoute role="doctor">
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescriptions/new"
            element={
              <ProtectedRoute role="doctor">
                <NewPrescription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/prescriptions/:id"
            element={
              <ProtectedRoute role="doctor">
                <Detail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute role="doctor">
                <Patients />
              </ProtectedRoute>
            }
          />

          {/* Paciente */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute role="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <ProtectedRoute role="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions/:id"
            element={
              <ProtectedRoute role="patient">
                <PrescriptionDetailPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/notifications"
            element={
              <ProtectedRoute role="patient">
                <PatientNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions/:id/qr"
            element={
              <ProtectedRoute role="patient">
                <PatientPrescriptionQR />
              </ProtectedRoute>
            }
          />
          
          <Route
  path="/patient/prescriptions/:id"
  element={
    <ProtectedRoute role="patient">
      <PrescriptionDetailPatient />
    </ProtectedRoute>
  }
/>

          {/* Pharmacy */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute role="pharmacy">
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/verify"
            element={
              <ProtectedRoute role="pharmacy">
                <PharmacyVerify />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/dispensed"
            element={
              <ProtectedRoute role="pharmacy">
                <DispensedHistory />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/doctor" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
