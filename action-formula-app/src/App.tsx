import { Route, Routes } from 'react-router-dom'

import './App.css'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { DiagnosticsPage } from './pages/DiagnosticsPage'
import { ExercisesPage } from './pages/ExercisesPage'
import { SupportPage } from './pages/SupportPage'
import { JournalPage } from './pages/JournalPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/journal" element={<JournalPage />} />
      </Route>
    </Routes>
  )
}

export default App
