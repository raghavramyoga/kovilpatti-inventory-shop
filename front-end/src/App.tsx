import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'

import { AppProvider } from './context/AppContext'
import { theme } from './theme'

import Layout from './components/Layout'
import Landing from './pages/Landing'
import AdminLogin from './pages/AdminLogin'
// Dashboard hidden for now — uncomment to re-enable along with the index route below and the Sidebar entry.
// import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Inventories from './pages/Inventories'
import Shops from './pages/Shops'
import Staff from './pages/Staff'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Layout />}>
              {/* Default landing inside /admin redirects to Products. Restore Dashboard by uncommenting. */}
              <Route index element={<Navigate to="products" replace />} />
              {/* <Route index element={<Dashboard />} /> */}
              <Route path="products" element={<Products />} />
              <Route path="create-account/inventory" element={<Inventories />} />
              <Route path="create-account/shop" element={<Shops />} />
              <Route path="create-account/user" element={<Staff />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  )
}

export default App
