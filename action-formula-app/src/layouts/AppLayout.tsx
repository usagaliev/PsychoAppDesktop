import { Outlet } from 'react-router-dom'

import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
