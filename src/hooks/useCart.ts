// Re-export the single shared CartContext hook so no component can instantiate duplicate cart state
export { useCartContext as useCart } from '../context/CartContext';
