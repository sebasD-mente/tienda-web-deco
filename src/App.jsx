import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroCarousel from './components/HeroCarousel';
import CategoryShelf from './components/CategoryShelf';
import AboutPostersPage from './pages/AboutPostersPage';
import CustomPostersPage from './pages/CustomPostersPage';
import AdminDashboard from './pages/AdminDashboard';
import ProductModal from './components/ProductModal';
import JarvisAgent from './components/JarvisAgent';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import { Bot } from 'lucide-react';
import { getStoredPosters, getStoredCategories } from './utils/catalogStorage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'about' | 'custom' | 'admin'
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [selectedPosterForModal, setSelectedPosterForModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  // Dynamic state for posters and categories
  const [posters, setPosters] = useState(getStoredPosters());
  const [categories, setCategories] = useState(getStoredCategories());

  // Listen to catalog updates from Admin
  useEffect(() => {
    const handleUpdate = () => {
      setPosters(getStoredPosters());
      setCategories(getStoredCategories());
    };

    window.addEventListener('deco-catalog-updated', handleUpdate);
    return () => window.removeEventListener('deco-catalog-updated', handleUpdate);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add item to cart or increment existing
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(
        i => i.poster.id === item.poster.id && i.size.id === item.size.id
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
  };

  const handleRemoveItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickWhatsApp = (item) => {
    const message = `👋 ¡Hola Deco Vintage! Me interesa ordenar:\n\n` +
      `🖼️ *Póster:* ${item.poster.title}\n` +
      `📐 *Tamaño:* ${item.size.name} (${item.size.dimensions})\n` +
      `💰 *Precio:* Q${item.price.toFixed(2)}\n\n` +
      `¿Tienen disponibilidad para coordinar la entrega?`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#060910' }}>
      
      {/* Top Fixed Minimalist Navbar */}
      <Navbar
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenJarvis={() => setIsJarvisOpen(true)}
        onSearch={(query) => {
          setSearchQuery(query);
          if (currentPage !== 'home') setCurrentPage('home');
        }}
        searchQuery={searchQuery}
        activePage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Multi-Page Body */}
      <main>
        {currentPage === 'home' && (
          <>
            {/* Hero Showcase with Dynamic Featured Posters */}
            <HeroCarousel
              onSelectPoster={(p) => setSelectedPosterForModal(p)}
              posters={posters}
            />

            {/* Dynamic Shelf Catalog */}
            <CategoryShelf
              onSelectPoster={(p) => setSelectedPosterForModal(p)}
              onAddToCart={handleAddToCart}
              onQuickWhatsApp={handleQuickWhatsApp}
              filterCategory={selectedCategory}
              searchQuery={searchQuery}
              posters={posters}
              categories={categories}
            />
          </>
        )}

        {currentPage === 'about' && (
          <AboutPostersPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'custom' && (
          <CustomPostersPage onNavigate={handleNavigate} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Footer with Page Navigation */}
      <Footer onNavigate={handleNavigate} />

      {/* Product Detail Modal */}
      <ProductModal
        poster={selectedPosterForModal}
        onClose={() => setSelectedPosterForModal(null)}
        onAddToCart={handleAddToCart}
        onQuickWhatsApp={handleQuickWhatsApp}
      />

      {/* Jarvis AI Assistant Widget */}
      <JarvisAgent
        isOpen={isJarvisOpen}
        onClose={() => setIsJarvisOpen(false)}
        onQuickWhatsApp={handleQuickWhatsApp}
      />

      {/* Floating Jarvis Trigger Button (When closed) */}
      {!isJarvisOpen && (
        <button
          onClick={() => setIsJarvisOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--grad-cyan)',
            border: '2px solid rgba(0, 242, 254, 0.6)',
            boxShadow: '0 8px 30px rgba(0, 242, 254, 0.4)',
            color: '#070a10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 99,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          title="Abrir Jarvis IA"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
      />
    </div>
  );
}
