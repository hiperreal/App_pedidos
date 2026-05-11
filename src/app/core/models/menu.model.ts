export interface MenuExtra {
  name: string;
  price: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  emoji: string;
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
}

export const MENU_CATEGORIES = ['Todos','Combos','Hamburguesas','Bebidas','Postres'];

export const MENU_ITEMS: MenuItem[] = [
  { id:1, name:'Combo Clásico',       category:'Combos',       emoji:'🍔', basePrice:8.50,  bg:'#FFE0C4',
    extras:[{name:'Queso extra',price:.80},{name:'Doble carne',price:2.00},{name:'Tocino',price:1.20}],
    variants:{label:'Refresco', options:['Cola','Naranja','Limón','Uva']} },
  { id:2, name:'Combo Familiar',      category:'Combos',       emoji:'🍟', basePrice:18.00, bg:'#FFE0C4',
    extras:[{name:'Papas extra',price:1.50},{name:'Salsa BBQ',price:.50}],
    variants:{label:'Bebida', options:['Cola','Agua','Jugo']} },
  { id:3, name:'Hamburguesa Clásica', category:'Hamburguesas', emoji:'🥩', basePrice:6.50,  bg:'#FFD6C4',
    extras:[{name:'Queso',price:.80},{name:'Huevo',price:.70},{name:'Jalapeño',price:.40}],
    variants:{label:'Pan', options:['Normal','Integral','Sin gluten']} },
  { id:4, name:'Veggie Burger',       category:'Hamburguesas', emoji:'🥗', basePrice:7.00,  bg:'#D5F5E3',
    extras:[{name:'Aguacate',price:1.00},{name:'Extra verduras',price:.60}],
    variants:{label:'Pan', options:['Normal','Integral']} },
  { id:5, name:'Refresco',            category:'Bebidas',      emoji:'🥤', basePrice:1.50,  bg:'#D0EAF7',
    extras:[],
    variants:{label:'Sabor', options:['Cola','Naranja','Limón','Uva']} },
  { id:6, name:'Malteada',            category:'Bebidas',      emoji:'🧋', basePrice:3.50,  bg:'#FAD7F7',
    extras:[{name:'Extra crema',price:.50}],
    variants:{label:'Sabor', options:['Chocolate','Fresa','Vainilla']} },
  { id:7, name:'Helado',              category:'Postres',      emoji:'🍦', basePrice:2.50,  bg:'#FFF9C4',
    extras:[{name:'Chispas',price:.40},{name:'Caramelo',price:.30}],
    variants:{label:'Sabor', options:['Vainilla','Chocolate','Fresa']} },
  { id:8, name:'Brownie',             category:'Postres',      emoji:'🍫', basePrice:3.00,  bg:'#D7C4B7',
    extras:[{name:'Con helado',price:1.50}],
    variants:{label:'Temperatura', options:['Caliente','Frío']} },
];