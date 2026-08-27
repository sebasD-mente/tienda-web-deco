import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import CategoryShelf from './components/CategoryShelf';
import AdminLoginModal from './components/AdminLoginModal';
import ProductModal from './components/ProductModal';
import JarvisAgent from './components/JarvisAgent';
import ArcReactor from './components/ArcReactor';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import { Bot, Loader2 } from 'lucide-react';
import { getStoredPosters, getStoredCategories, getStoredFranchises } from './utils/catalogStorage';
import { generateWhatsAppLink } from './config/constants';

// Code-Splitting: Lazy load heavy secondary pages to keep initial bundle lightweight
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const CategoryGalleryPage = lazy(() => import('./pages/CategoryGalleryPage'));
const FranchiseGalleryPage = lazy(() => import('./pages/FranchiseGalleryPage'));
const AboutPostersPage = lazy(() => import('./pages/AboutPostersPage'));
const CustomPostersPage = lazy(() => import('./pages/CustomPostersPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// Sleek Deco Vintage / Stark OS Page Loader Fallback
function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      color: 'var(--accent-cyan, #00f0ff)'
    }}>
      <Loader2 size={38} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.85rem', letterSpacing: '0.1em', opacity: 0.8, textTransform: 'uppercase' }}>
        Cargando experiencia...
      </span>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'catalog' | 'category' | 'franchise' | 'about' | 'custom' | 'admin'
  const [selectedCategoryId, setSelectedCategoryId] = useState('AUTOS');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('avengers');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [selectedPosterForModal, setSelectedPosterForModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Admin authentication state (persisted per session)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('deco_admin_auth') === 'true';
  });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);

  // Dynamic state for posters, categories, and franchises
  const [posters, setPosters] = useState(getStoredPosters());
  const [categories, setCategories] = useState(getStoredCategories());
  const [franchises, setFranchises] = useState(getStoredFranchises());

  // Listen to catalog updates from Admin
  useEffect(() => {
    const handleUpdate = () => {
      setPosters(getStoredPosters());
      setCategories(getStoredCategories());
      setFranchises(getStoredFranchises());
    };

    window.addEventListener('deco-catalog-updated', handleUpdate);
    return () => window.removeEventListener('deco-catalog-updated', handleUpdate);
  }, []);

  // Initialize initial history entry on first load
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ type: 'page', page: 'home' }, '');
    }
  }, []);

  // Handle native mobile back button, gestures & desktop browser Back/Forward arrows
  useEffect(() => {
    const handlePopState = (event) => {
      // 1. If any modal is active, close the modal and remain on current page
      if (selectedPosterForModal || isCartOpen || isJarvisOpen || showAdminLoginModal) {
        setSelectedPosterForModal(null);
        setIsCartOpen(false);
        setIsJarvisOpen(false);
        setShowAdminLoginModal(false);
        return;
      }

      // 2. Otherwise navigate to the previous page state
      const state = event.state;
      if (state && state.type === 'page') {
        setCurrentPage(state.page || 'home');
        if (state.categoryId) setSelectedCategoryId(state.categoryId);
        if (state.franchiseId) setSelectedFranchiseId(state.franchiseId);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedPosterForModal, isCartOpen, isJarvisOpen, showAdminLoginModal]);

  // Modal Open / Close Handlers with Browser History Sync
  const handleOpenPosterModal = (poster) => {
    if (poster) {
      window.history.pushState({ type: 'modal', modalType: 'poster' }, '');
      setSelectedPosterForModal(poster);
    }
  };

  const handleClosePosterModal = () => {
    setSelectedPosterForModal(null);
    if (window.history.state?.type === 'modal' && window.history.state?.modalType === 'poster') {
      window.history.back();
    }
  };

  const handleOpenCart = () => {
    window.history.pushState({ type: 'modal', modalType: 'cart' }, '');
    setIsCartOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
    if (window.history.state?.type === 'modal' && window.history.state?.modalType === 'cart') {
      window.history.back();
    }
  };

  const handleOpenJarvis = () => {
    window.history.pushState({ type: 'modal', modalType: 'jarvis' }, '');
    setIsJarvisOpen(true);
  };

  const handleCloseJarvis = () => {
    setIsJarvisOpen(false);
    if (window.history.state?.type === 'modal' && window.history.state?.modalType === 'jarvis') {
      window.history.back();
    }
  };

  const handleOpenAdminLogin = () => {
    window.history.pushState({ type: 'modal', modalType: 'adminLogin' }, '');
    setShowAdminLoginModal(true);
  };

  const handleCloseAdminLogin = () => {
    setShowAdminLoginModal(false);
    if (window.history.state?.type === 'modal' && window.history.state?.modalType === 'adminLogin') {
      window.history.back();
    }
  };

  const handleNavigate = (page, categoryId = null) => {
    if (page === 'admin' && !isAdminAuthenticated) {
      handleOpenAdminLogin();
      return;
    }
    if (page === 'category' && categoryId) {
      setSelectedCategoryId(categoryId);
    }

    // Push new page state to browser history if moving to a different view
    if (page !== currentPage || (page === 'category' && categoryId !== selectedCategoryId)) {
      window.history.pushState({
        type: 'page',
        page,
        categoryId: categoryId || (page === 'category' ? selectedCategoryId : null)
      }, '');
    }

    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('deco_admin_auth', 'true');
    setShowAdminLoginModal(false);
    window.history.pushState({ type: 'page', page: 'admin' }, '');
    setCurrentPage('admin');
    window.scrollTo(0, 0);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('deco_admin_auth');
    window.history.pushState({ type: 'page', page: 'home' }, '');
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const handleSelectCategory = (catId) => {
    setSelectedCategoryId(catId);
    window.history.pushState({
      type: 'page',
      page: 'category',
      categoryId: catId
    }, '');
    setCurrentPage('category');
    window.scrollTo(0, 0);
  };

  const handleSelectFranchise = (fId) => {
    const cleanId = typeof fId === 'object' ? fId.id : fId;
    setSelectedFranchiseId(cleanId);
    window.history.pushState({
      type: 'page',
      page: 'franchise',
      franchiseId: cleanId
    }, '');
    setCurrentPage('franchise');
    window.scrollTo(0, 0);
  };

  // Add item to cart or increment existing
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.poster?.id === item.poster?.id && i.size?.id === item.size?.id
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (Number(updated[existingIdx].quantity) || 1) + (Number(item.quantity) || 1)
        };
        return updated;
      }
      return [...prev, { ...item, quantity: Number(item.quantity) || 1 }];
    });
  };

  const handleRemoveItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = (Number(updated[index]?.quantity) || 1) + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleQuickWhatsApp = (item) => {
    const message = `👋 ¡Hola Deco Vintage! Me interesa ordenar:\n\n` +
      `🖼️ *Póster:* ${item.poster.title}\n` +
      `📐 *Tamaño:* ${item.size.name} (${item.size.dimensions})\n` +
      `💰 *Precio:* Q${item.price.toFixed(2)}\n\n` +
      `¿Tienen disponibilidad para coordinar la entrega?`;
    const waUrl = generateWhatsAppLink(message);
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#060910' }}>
      
      {/* Top Fixed Minimalist Navbar */}
      <Navbar
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={handleOpenCart}
        onOpenJarvis={handleOpenJarvis}
        posters={posters}
        categories={categories}
        onSelectPoster={handleOpenPosterModal}
        onSearch={(query) => {
          setSearchQuery(query);
          if (currentPage !== 'catalog' && currentPage !== 'home') {
            setCurrentPage('catalog');
          }
        }}
        searchQuery={searchQuery}
        activePage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Multi-Page Body with Suspense for Instant Load */}
      <main>
        <Suspense fallback={<PageLoader />}>
          {/* 1. HOME PAGE: 5 Selected Carousels (Franchises, Best Sellers, and 3 Random Daily Spotlight Categories) */}
          {currentPage === 'home' && (
            <>
              <HeroCarousel
                onSelectPoster={handleOpenPosterModal}
                onSelectCategory={handleSelectCategory}
                onSelectFranchise={handleSelectFranchise}
                onNavigate={handleNavigate}
                posters={posters}
                franchises={franchises}
              />

              <CategoryShelf
                onSelectPoster={handleOpenPosterModal}
                onSelectCategory={handleSelectCategory}
                onNavigate={handleNavigate}
                searchQuery={searchQuery}
                posters={posters}
                categories={categories}
              />
            </>
          )}

          {/* 2. FULL CATALOG PAGE: Showcases all collections with direct category gallery entry buttons */}
          {currentPage === 'catalog' && (
            <CatalogPage
              categories={categories}
              posters={posters}
              onSelectPoster={handleOpenPosterModal}
              onSelectCategory={handleSelectCategory}
              onNavigate={handleNavigate}
            />
          )}

          {/* 3. CATEGORY GALLERY PAGE: Dedicated grid gallery for the chosen category */}
          {currentPage === 'category' && (
            <CategoryGalleryPage
              categoryId={selectedCategoryId}
              categories={categories}
              posters={posters}
              onSelectPoster={handleOpenPosterModal}
              onNavigate={handleNavigate}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* 4. FRANCHISE GALLERY PAGE: Dedicated grid gallery for the chosen franchise */}
          {currentPage === 'franchise' && (
            <FranchiseGalleryPage
              franchiseId={selectedFranchiseId}
              franchises={franchises}
              categories={categories}
              posters={posters}
              onSelectPoster={handleOpenPosterModal}
              onNavigate={handleNavigate}
              onSelectFranchise={handleSelectFranchise}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* 5. ABOUT POSTERS PAGE */}
          {currentPage === 'about' && (
            <AboutPostersPage onNavigate={handleNavigate} />
          )}

          {/* 6. CUSTOM POSTERS PAGE */}
          {currentPage === 'custom' && (
            <CustomPostersPage onNavigate={handleNavigate} />
          )}

          {/* 7. ADMIN DASHBOARD (Protected) */}
          {currentPage === 'admin' && (
            isAdminAuthenticated ? (
              <AdminDashboard onNavigate={handleNavigate} onLogout={handleAdminLogout} />
            ) : (
              <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Acceso protegido. Por favor inicie sesión.
              </div>
            )
          )}
        </Suspense>
      </main>

      {/* Global Footer with Page Navigation */}
      <Footer onNavigate={handleNavigate} />

      {/* Admin Login Modal (Single Admin SebasDmente) */}
      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={handleCloseAdminLogin}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Product Detail Modal */}
      <ProductModal
        poster={selectedPosterForModal}
        onClose={handleClosePosterModal}
        onAddToCart={handleAddToCart}
        onQuickWhatsApp={handleQuickWhatsApp}
        onOpenCart={() => {
          handleClosePosterModal();
          setIsCartOpen(true);
        }}
      />

      {/* Jarvis AI Assistant Widget */}
      <JarvisAgent
        isOpen={isJarvisOpen}
        onClose={handleCloseJarvis}
        onQuickWhatsApp={handleQuickWhatsApp}
        cart={cart}
        onAddToCart={handleAddToCart}
        onOpenProductModal={handleOpenPosterModal}
        onNavigate={handleNavigate}
      />

      {/* Floating Jarvis Arc Reactor Trigger Button (When closed) */}
      {!isJarvisOpen && (
        <div
          onClick={handleOpenJarvis}
          className="jarvis-trigger-orb"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            padding: 0
          }}
          title="Abrir J.A.R.V.I.S. AI"
        >
          <ArcReactor size={52} />
        </div>
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCloseCart}
        cartItems={cart}
        onRemoveItem={handleRemoveItem}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
