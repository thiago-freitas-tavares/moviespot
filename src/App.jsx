import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from './components/layout/Layout.jsx'
import FavoritesProvider from './context/FavoritesProvider.jsx'
import PreferencesProvider from './context/PreferencesProvider.jsx'
import ToastProvider from './context/ToastProvider.jsx'

// Cada página vira um arquivo JS separado, baixado só quando a rota é visitada.
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const HelpPage = lazy(() => import('./pages/HelpPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  return (
    <BrowserRouter>
      <PreferencesProvider>
        <ToastProvider>
          <FavoritesProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="filme/:id" element={<MovieDetailsPage />} />
                <Route path="favoritos" element={<FavoritesPage />} />
                <Route path="ajuda" element={<HelpPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </FavoritesProvider>
        </ToastProvider>
      </PreferencesProvider>
    </BrowserRouter>
  )
}
