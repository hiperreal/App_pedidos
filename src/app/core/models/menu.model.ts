export interface MenuExtra {
  name: string;
  price: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  emoji: string;
  imageUrl: string;
  basePrice: number;
  bg: string;
  extras: MenuExtra[];
  variants: { label: string; options: string[] };
}

export interface CartItem {
  uid: number;
  itemId: number;
  name: string;
  emoji: string;
  imageUrl: string;
  variant: string;
  extras: { name: string; qty: number; price: number }[];
  notes: string;
  price: number;
}

export interface Order {
  id: number;
  num: string;
  items: string[];
  notes: string;
  payMethod: string;
  total: number;
  time: string;
  address: string;
  lat: number;
  lng: number;
  deliveryLat?: number;
  deliveryLng?: number;
  status?: string;
}

export const MENU_CATEGORIES = ['Todos','Combos','Hamburguesas','Alitas','Bebidas','Postres'];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 1, name: 'Combo Clásico', category: 'Combos', emoji: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    basePrice: 4500, bg: '#FFE0C4',
    extras: [{name:'Queso extra',price:400},{name:'Doble carne',price:1000},{name:'Tocino',price:600}],
    variants: {label:'Refresco', options:['Cola','Naranja','Limón','Uva']}
  },
  {
    id: 2, name: 'Combo Familiar', category: 'Combos', emoji: '🍟',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
    basePrice: 9500, bg: '#FFE0C4',
    extras: [{name:'Papas extra',price:800},{name:'Salsa BBQ',price:300}],
    variants: {label:'Bebida', options:['Cola','Agua','Jugo']}
  },
  {
    id: 3, name: 'Combo Doble', category: 'Combos', emoji: '🍔',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80',
    basePrice: 6500, bg: '#FFE0C4',
    extras: [{name:'Queso extra',price:400},{name:'Tocino',price:600},{name:'Salsa especial',price:300}],
    variants: {label:'Refresco', options:['Cola','Naranja','Limón','Uva']}
  },
  {
    id: 4, name: 'Hamburguesa Clásica', category: 'Hamburguesas', emoji: '🥩',
    imageUrl: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400&q=80',
    basePrice: 3500, bg: '#FFD6C4',
    extras: [{name:'Queso',price:400},{name:'Huevo',price:350},{name:'Jalapeño',price:200}],
    variants: {label:'Pan', options:['Normal','Integral','Sin gluten']}
  },
  {
    id: 5, name: 'Veggie Burger', category: 'Hamburguesas', emoji: '🥗',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80',
    basePrice: 3800, bg: '#D5F5E3',
    extras: [{name:'Aguacate',price:500},{name:'Extra verduras',price:300}],
    variants: {label:'Pan', options:['Normal','Integral']}
  },
  {
    id: 6, name: 'Alitas BBQ', category: 'Alitas', emoji: '🍗',
    imageUrl: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80',
    basePrice: 4800, bg: '#FFD0A0',
    extras: [{name:'Salsa extra',price:300},{name:'Papas fritas',price:800}],
    variants: {label:'Salsa', options:['BBQ','Miel mostaza','Picante','Teriyaki']}
  },
  {
    id: 7, name: 'Alitas Picantes', category: 'Alitas', emoji: '🌶️',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80',
    basePrice: 4800, bg: '#FFD0A0',
    extras: [{name:'Salsa extra',price:300},{name:'Aderezo ranch',price:400}],
    variants: {label:'Picante', options:['Suave','Medio','Fuerte','Extra fuerte']}
  },
  {
    id: 8, name: 'Refresco', category: 'Bebidas', emoji: '🥤',
    imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&q=80',
    basePrice: 800, bg: '#D0EAF7',
    extras: [],
    variants: {label:'Sabor', options:['Cola','Naranja','Limón','Uva']}
  },
  {
    id: 9, name: 'Malteada', category: 'Bebidas', emoji: '🧋',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
    basePrice: 1800, bg: '#FAD7F7',
    extras: [{name:'Extra crema',price:300}],
    variants: {label:'Sabor', options:['Chocolate','Fresa','Vainilla']}
  },
  {
    id: 10, name: 'Helado', category: 'Postres', emoji: '🍦',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
    basePrice: 1200, bg: '#FFF9C4',
    extras: [{name:'Chispas',price:200},{name:'Caramelo',price:150}],
    variants: {label:'Sabor', options:['Vainilla','Chocolate','Fresa']}
  },
  {
    id: 11, name: 'Brownie', category: 'Postres', emoji: '🍫',
    imageUrl: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80',
    basePrice: 1500, bg: '#D7C4B7',
    extras: [{name:'Con helado',price:800}],
    variants: {label:'Temperatura', options:['Caliente','Frío']}
  },
  {
    id: 12, name: 'Cheesecake', category: 'Postres', emoji: '🍰',
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
    basePrice: 1800, bg: '#FFF0E0',
    extras: [{name:'Salsa de frutos rojos',price:300},{name:'Crema chantilly',price:200}],
    variants: {label:'Sabor', options:['Fresa','Maracuyá','Chocolate','Original']}
  },
];