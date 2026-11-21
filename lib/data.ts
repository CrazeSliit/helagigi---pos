// Realistic Sri Lankan sample data for HeladiGi POS (UI only — no backend).

export type StockState = "in" | "low" | "out";

export type Category = { id: string; name: [string, string, string]; icon: string; color: string; count: number };

export const categories: Category[] = [
  { id: "bev", name: ["Beverages", "පාන වර්ග", "பானங்கள்"], icon: "CupSoda", color: "#B9DDF7", count: 186 },
  { id: "dairy", name: ["Dairy", "කිරි නිෂ්පාදන", "பால் பொருட்கள்"], icon: "Milk", color: "#EAF0FB", count: 124 },
  { id: "snacks", name: ["Snacks", "කෙටි ආහාර", "சிற்றுண்டிகள்"], icon: "Cookie", color: "#FFF0E0", count: 231 },
  { id: "tea", name: ["Tea & Coffee", "තේ සහ කෝපි", "தேநீர் & காபி"], icon: "Coffee", color: "#FDE7C8", count: 64 },
  { id: "grocery", name: ["Grocery", "සිල්ලර බඩු", "மளிகை"], icon: "Wheat", color: "#F3EBDD", count: 412 },
  { id: "fresh", name: ["Fresh & Loose", "නැවුම් / බර කිරන", "புதிய / எடை"], icon: "Apple", color: "#DDF3E4", count: 58 },
  { id: "house", name: ["Household", "ගෘහ භාණ්ඩ", "வீட்டுப் பொருட்கள்"], icon: "SprayCan", color: "#E6E9F7", count: 175 },
  { id: "care", name: ["Personal Care", "පුද්ගලික සත්කාර", "தனிநபர் பராமரிப்பு"], icon: "Sparkles", color: "#F7E4EE", count: 203 },
  { id: "pharma", name: ["Pharmacy", "ඖෂධ", "மருந்தகம்"], icon: "Pill", color: "#E2F0F7", count: 96 },
];

export type Variant = { group: string; options: string[] };
export type Product = {
  id: string; name: string; si?: string; brand: string; cat: string; price: number; cost: number; mrp?: number;
  stock: number; reorder: number; unit: "pcs" | "kg" | "L" | "pack"; sku: string; barcode: string; icon: string;
  weighed?: boolean; variants?: Variant[]; fav?: boolean; active?: boolean;
};

const P = (p: Omit<Product, "sku" | "barcode" | "active"> & { sku?: string; barcode?: string }, i: number): Product => ({
  sku: p.sku ?? `HD-${p.cat.toUpperCase().slice(0, 3)}-${String(1000 + i * 7).padStart(4, "0")}`,
  barcode: p.barcode ?? `479${String(1203345 + i * 98761).padStart(10, "0").slice(0, 10)}`,
  active: true,
  ...p,
});

export const products: Product[] = [
  { id: "p1", name: "Anchor Milk Powder 400g", si: "ඇන්කර් කිරිපිටි 400g", brand: "Anchor", cat: "dairy", price: 1150, cost: 1015, mrp: 1190, stock: 84, reorder: 30, unit: "pcs", icon: "Milk", fav: true },
  { id: "p2", name: "Munchee Super Cream Cracker 490g", si: "මන්චි සුපර් ක්‍රීම් ක්‍රැකර් 490g", brand: "Munchee", cat: "snacks", price: 560, cost: 468, stock: 142, reorder: 40, unit: "pcs", icon: "Cookie", fav: true },
  { id: "p3", name: "Elephant House Cream Soda 1.5L", si: "එලිෆන්ට් හවුස් ක්‍රීම් සෝඩා 1.5L", brand: "Elephant House", cat: "bev", price: 420, cost: 352, stock: 18, reorder: 24, unit: "pcs", icon: "CupSoda", fav: true },
  { id: "p4", name: "Dilmah Tea 100 bags", si: "ඩිල්මා තේ කොළ මලු 100", brand: "Dilmah", cat: "tea", price: 1450, cost: 1220, stock: 46, reorder: 15, unit: "pack", icon: "Coffee", fav: true },
  { id: "p5", name: "Maliban Gold Marie 350g", si: "මලිබන් ගෝල්ඩ් මාරි 350g", brand: "Maliban", cat: "snacks", price: 380, cost: 318, stock: 96, reorder: 30, unit: "pcs", icon: "Cookie" },
  { id: "p6", name: "Kotmale Fresh Milk 1L", si: "කොත්මලේ නැවුම් කිරි 1L", brand: "Kotmale", cat: "dairy", price: 620, cost: 540, stock: 7, reorder: 20, unit: "pcs", icon: "Milk" },
  { id: "p7", name: "Highland Set Yoghurt 80g", si: "හයිලන්ඩ් යෝගට් 80g", brand: "Highland", cat: "dairy", price: 90, cost: 72, stock: 220, reorder: 60, unit: "pcs", icon: "Soup", fav: true },
  { id: "p8", name: "Elephant House Ice Cream", si: "එලිෆන්ට් හවුස් අයිස්ක්‍රීම්", brand: "Elephant House", cat: "dairy", price: 1100, cost: 905, stock: 34, reorder: 12, unit: "pcs", icon: "IceCreamCone", variants: [{ group: "Flavour", options: ["Vanilla", "Chocolate", "Strawberry", "Cashew Crunch"] }, { group: "Size", options: ["1L", "2L"] }] },
  { id: "p9", name: "Nestomalt 400g Pouch", brand: "Nestlé", cat: "bev", price: 990, cost: 860, stock: 0, reorder: 18, unit: "pcs", icon: "Coffee" },
  { id: "p10", name: "Coca-Cola 1.5L", brand: "Coca-Cola", cat: "bev", price: 450, cost: 378, stock: 58, reorder: 24, unit: "pcs", icon: "CupSoda" },
  { id: "p11", name: "EGB Ginger Beer 400ml", brand: "Elephant House", cat: "bev", price: 200, cost: 158, stock: 120, reorder: 36, unit: "pcs", icon: "CupSoda", fav: true },
  { id: "p12", name: "Kist Mixed Fruit Jam 510g", brand: "Kist", cat: "grocery", price: 720, cost: 610, stock: 31, reorder: 12, unit: "pcs", icon: "Apple" },
  { id: "p13", name: "Prima Kottu Mee 80g", brand: "Prima", cat: "grocery", price: 160, cost: 128, stock: 260, reorder: 80, unit: "pcs", icon: "Soup", fav: true },
  { id: "p14", name: "Samba Rice (loose)", si: "සම්බා සහල් (බරට)", brand: "Araliya", cat: "fresh", price: 260, cost: 222, stock: 340, reorder: 100, unit: "kg", icon: "Wheat", weighed: true, fav: true },
  { id: "p15", name: "Red Onions (loose)", si: "රතු ළූණු (බරට)", brand: "Local", cat: "fresh", price: 480, cost: 395, stock: 42, reorder: 30, unit: "kg", icon: "Carrot", weighed: true },
  { id: "p16", name: "Potatoes (loose)", brand: "Nuwara Eliya", cat: "fresh", price: 360, cost: 298, stock: 65, reorder: 40, unit: "kg", icon: "Carrot", weighed: true },
  { id: "p17", name: "Mysore Dhal 1kg", brand: "CIC", cat: "grocery", price: 340, cost: 290, stock: 88, reorder: 40, unit: "pcs", icon: "Wheat" },
  { id: "p18", name: "White Sugar 1kg", brand: "Lanka Sugar", cat: "grocery", price: 270, cost: 238, stock: 12, reorder: 50, unit: "pcs", icon: "Candy" },
  { id: "p19", name: "Sunlight Soap 110g", brand: "Sunlight", cat: "house", price: 150, cost: 118, stock: 300, reorder: 80, unit: "pcs", icon: "Droplets" },
  { id: "p20", name: "Vim Dishwash Liquid 500ml", brand: "Vim", cat: "house", price: 540, cost: 452, stock: 44, reorder: 20, unit: "pcs", icon: "SprayCan" },
  { id: "p21", name: "Harpic Toilet Cleaner 500ml", brand: "Harpic", cat: "house", price: 790, cost: 668, stock: 0, reorder: 12, unit: "pcs", icon: "SprayCan" },
  { id: "p22", name: "Diva Detergent Powder 1kg", brand: "Diva", cat: "house", price: 680, cost: 575, stock: 52, reorder: 20, unit: "pcs", icon: "Droplets" },
  { id: "p23", name: "Signal Toothpaste", brand: "Signal", cat: "care", price: 310, cost: 255, stock: 76, reorder: 24, unit: "pcs", icon: "Sparkles", variants: [{ group: "Size", options: ["70g", "120g", "160g"] }, { group: "Type", options: ["Strong Teeth", "Herbal", "Cavity Fighter"] }] },
  { id: "p24", name: "Clogard Toothpaste 120g", brand: "Clogard", cat: "care", price: 260, cost: 214, stock: 9, reorder: 24, unit: "pcs", icon: "Sparkles" },
  { id: "p25", name: "Baby Cheramy Powder 100g", brand: "Baby Cheramy", cat: "care", price: 390, cost: 318, stock: 38, reorder: 15, unit: "pcs", icon: "Baby" },
  { id: "p26", name: "Lifebuoy Soap 100g", brand: "Lifebuoy", cat: "care", price: 180, cost: 146, stock: 210, reorder: 60, unit: "pcs", icon: "Droplets" },
  { id: "p27", name: "Panadol 500mg (10 tabs)", brand: "GSK", cat: "pharma", price: 52, cost: 41, stock: 480, reorder: 120, unit: "pack", icon: "Pill" },
  { id: "p28", name: "Siddhalepa Balm 25g", brand: "Siddhalepa", cat: "pharma", price: 340, cost: 276, stock: 61, reorder: 20, unit: "pcs", icon: "Pill" },
  { id: "p29", name: "Kandos Milk Chocolate 100g", brand: "Kandos", cat: "snacks", price: 520, cost: 430, stock: 27, reorder: 20, unit: "pcs", icon: "Candy" },
  { id: "p30", name: "Tiara Layer Cake 18g", brand: "Ceylon Biscuits", cat: "snacks", price: 60, cost: 46, stock: 340, reorder: 100, unit: "pcs", icon: "Croissant" },
  { id: "p31", name: "Ratthi Milk Powder 400g", brand: "Ratthi", cat: "dairy", price: 1060, cost: 935, stock: 22, reorder: 25, unit: "pcs", icon: "Milk" },
  { id: "p32", name: "Keells Krest Chicken Sausages 500g", brand: "Keells Krest", cat: "grocery", price: 980, cost: 820, stock: 19, reorder: 10, unit: "pcs", icon: "Beef" },
].map((p, i) => P(p as Product, i));

export const stockState = (p: { stock: number; reorder: number }): StockState =>
  p.stock <= 0 ? "out" : p.stock < p.reorder ? "low" : "in";

export const branches = [
  { id: "cmb", name: "Colombo 03", address: "No. 214, Galle Road, Colombo 03", phone: "+94 11 257 4410", manager: "Dilani Fernando", terminals: 4, today: 486_250, status: "online" as const },
  { id: "kdy", name: "Kandy", address: "No. 58, Dalada Veediya, Kandy", phone: "+94 81 222 3109", manager: "Ruwan Bandara", terminals: 3, today: 312_780, status: "online" as const },
  { id: "kur", name: "Kurunegala", address: "No. 12, Puttalam Road, Kurunegala", phone: "+94 37 223 0551", manager: "Ishara Wijesinghe", terminals: 2, today: 198_420, status: "syncing" as const },
];

export type Staff = { id: string; name: string; role: string; branch: string; phone: string; status: "Active" | "Inactive"; last: string; color: string; sales?: number; tx?: number };
export const staff: Staff[] = [
  { id: "s0", name: "Craze Weligepola", role: "Owner", branch: "All branches", phone: "+94 77 123 4567", status: "Active", last: "Today, 08:12", color: "#0B1E4F" },
  { id: "s1", name: "Dilani Fernando", role: "Manager", branch: "Colombo 03", phone: "+94 71 552 1934", status: "Active", last: "Today, 07:55", color: "#1A3170" },
  { id: "s2", name: "Kasun Jayasuriya", role: "Cashier", branch: "Colombo 03", phone: "+94 76 420 8812", status: "Active", last: "Today, 08:01", color: "#FF7A00", sales: 148_620, tx: 96 },
  { id: "s3", name: "Sachini Perera", role: "Cashier", branch: "Colombo 03", phone: "+94 70 319 4455", status: "Active", last: "Today, 08:04", color: "#E56A00", sales: 132_480, tx: 88 },
  { id: "s4", name: "Mohamed Imran", role: "Cashier", branch: "Kandy", phone: "+94 77 845 0021", status: "Active", last: "Today, 08:20", color: "#2563EB", sales: 121_950, tx: 79 },
  { id: "s5", name: "Tharushi Silva", role: "Cashier", branch: "Kandy", phone: "+94 72 610 7743", status: "Active", last: "Yesterday, 21:10", color: "#16A34A", sales: 98_340, tx: 71 },
  { id: "s6", name: "Ruwan Bandara", role: "Manager", branch: "Kandy", phone: "+94 71 900 2288", status: "Active", last: "Today, 07:48", color: "#4A5875" },
  { id: "s7", name: "Ishara Wijesinghe", role: "Accountant", branch: "Kurunegala", phone: "+94 75 233 9010", status: "Active", last: "Today, 09:02", color: "#7C3AED" },
  { id: "s8", name: "Nuwan Ekanayake", role: "Stock Keeper", branch: "Kurunegala", phone: "+94 78 455 6620", status: "Active", last: "Today, 07:30", color: "#0891B2" },
  { id: "s9", name: "Anushka Rajapaksha", role: "Cashier", branch: "Kurunegala", phone: "+94 70 118 2240", status: "Inactive", last: "12/11/2026", color: "#8A96AD", sales: 0, tx: 0 },
];

export type Customer = { id: string; name: string; phone: string; email: string; group: "Retail" | "Wholesale" | "VIP"; tier: "Silver" | "Gold" | "Platinum"; spent: number; visits: number; points: number; credit: number; limit: number; last: string; since: string };
export const customers: Customer[] = [
  { id: "c1", name: "Nimal Perera", phone: "+94 77 214 5566", email: "nimal.perera@gmail.com", group: "Retail", tier: "Gold", spent: 284_650, visits: 62, points: 2846, credit: 4_500, limit: 25_000, last: "21/11/2026", since: "03/2023" },
  { id: "c2", name: "Fathima Rizwan", phone: "+94 71 889 2301", email: "fathima.r@yahoo.com", group: "VIP", tier: "Platinum", spent: 612_300, visits: 118, points: 6123, credit: 0, limit: 50_000, last: "20/11/2026", since: "08/2022" },
  { id: "c3", name: "Kavindu Silva", phone: "+94 76 330 7781", email: "kavindu.s@outlook.com", group: "Retail", tier: "Silver", spent: 48_920, visits: 17, points: 489, credit: 0, limit: 10_000, last: "21/11/2026", since: "01/2026" },
  { id: "c4", name: "Sanduni Rathnayake", phone: "+94 70 552 9014", email: "sanduni.r@gmail.com", group: "Retail", tier: "Gold", spent: 196_400, visits: 44, points: 1964, credit: 12_750, limit: 20_000, last: "18/11/2026", since: "05/2023" },
  { id: "c5", name: "Lanka Traders (Pvt) Ltd", phone: "+94 11 269 4410", email: "accounts@lankatraders.lk", group: "Wholesale", tier: "Platinum", spent: 1_842_000, visits: 96, points: 0, credit: 186_400, limit: 300_000, last: "19/11/2026", since: "02/2022" },
  { id: "c6", name: "Anjali Thevarajah", phone: "+94 77 640 1188", email: "anjali.t@gmail.com", group: "Retail", tier: "Silver", spent: 36_210, visits: 12, points: 362, credit: 0, limit: 10_000, last: "14/11/2026", since: "06/2026" },
  { id: "c7", name: "Chaminda Herath", phone: "+94 71 223 0099", email: "chaminda.h@gmail.com", group: "Retail", tier: "Gold", spent: 154_880, visits: 39, points: 1548, credit: 8_200, limit: 15_000, last: "10/11/2026", since: "11/2023" },
  { id: "c8", name: "Malsha Gunawardena", phone: "+94 75 802 4417", email: "malsha.g@icloud.com", group: "VIP", tier: "Platinum", spent: 402_150, visits: 81, points: 4021, credit: 0, limit: 40_000, last: "21/11/2026", since: "09/2022" },
  { id: "c9", name: "Ravi Shankar", phone: "+94 76 114 9902", email: "ravi.shankar@gmail.com", group: "Retail", tier: "Silver", spent: 22_640, visits: 8, points: 226, credit: 2_150, limit: 5_000, last: "30/10/2026", since: "08/2026" },
  { id: "c10", name: "Hotel Mahaweli Kitchen", phone: "+94 81 238 6600", email: "purchasing@mahaweli.lk", group: "Wholesale", tier: "Gold", spent: 968_500, visits: 52, points: 0, credit: 94_300, limit: 150_000, last: "17/11/2026", since: "04/2023" },
];

export const suppliers = [
  { id: "sp1", name: "Ceylon Biscuits Ltd (Munchee)", contact: "Asanka Dias", phone: "+94 11 438 2200", email: "orders@cbl.lk", outstanding: 284_500, total: 3_240_000, status: "Active" },
  { id: "sp2", name: "Fonterra Brands Lanka (Anchor)", contact: "Shehan Fonseka", phone: "+94 11 230 8800", email: "trade@fonterra.lk", outstanding: 512_800, total: 5_880_000, status: "Active" },
  { id: "sp3", name: "Elephant House (Ceylon Cold Stores)", contact: "Nadeesha Peris", phone: "+94 11 231 8318", email: "distribution@elephanthouse.lk", outstanding: 96_200, total: 2_110_000, status: "Active" },
  { id: "sp4", name: "Dilmah Ceylon Tea Company", contact: "Ruchira Senanayake", phone: "+94 11 482 2000", email: "local.sales@dilmah.lk", outstanding: 0, total: 940_000, status: "Active" },
  { id: "sp5", name: "Hemas Consumer Brands", contact: "Thilini Abeysekera", phone: "+94 11 473 1731", email: "orders@hemas.com", outstanding: 148_650, total: 1_670_000, status: "Active" },
  { id: "sp6", name: "Unilever Sri Lanka", contact: "Dimuth Karunaratne", phone: "+94 11 245 6000", email: "trade.lk@unilever.com", outstanding: 221_900, total: 2_960_000, status: "Active" },
  { id: "sp7", name: "Marandagahamula Rice Mills", contact: "Sunil Wickrama", phone: "+94 37 224 8833", email: "sales@mrm.lk", outstanding: 0, total: 1_120_000, status: "On hold" },
];

export type OrderStatus = "Completed" | "Refunded" | "Partially Refunded" | "Voided" | "On Credit";
export type Order = { id: string; date: string; time: string; customer: string; cashier: string; branch: string; items: number; total: number; method: string; status: OrderStatus };

const methods = ["Cash", "Card", "LankaQR", "Cash", "Card", "Credit", "Gift Card", "Cash"];
const stat: OrderStatus[] = ["Completed", "Completed", "Completed", "Completed", "Refunded", "Completed", "Partially Refunded", "Completed", "Voided", "Completed", "On Credit", "Completed"];
export const orders: Order[] = Array.from({ length: 48 }, (_, i) => {
  const c = i % 3 === 0 ? "Walk-in Customer" : customers[i % customers.length].name;
  const m = methods[i % methods.length];
  const s = m === "Credit" ? "On Credit" : stat[i % stat.length] === "On Credit" ? "Completed" : stat[i % stat.length];
  const mins = 14 * 60 + 52 - i * 11;
  const day = mins < 8 * 60 ? 20 : 21;
  const mm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor((mm < 8 * 60 ? mm + 12 * 60 : mm) / 60) % 24;
  return {
    id: `INV-C03-${String(18452 - i).padStart(6, "0")}`,
    date: `${day}/11/2026`,
    time: `${String(h).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`,
    customer: c,
    cashier: staff[2 + (i % 4)].name.split(" ")[0] + " " + staff[2 + (i % 4)].name.split(" ")[1][0] + ".",
    branch: branches[i % 5 === 4 ? 1 : i % 7 === 6 ? 2 : 0].name,
    items: 1 + ((i * 7) % 14),
    total: Math.round((620 + ((i * 3779) % 14800)) / 10) * 10,
    method: m,
    status: s,
  };
});

// Dashboard series
export const hourly = [
  { h: "07", now: 8_400, prev: 6_100 }, { h: "08", now: 24_600, prev: 19_800 }, { h: "09", now: 41_200, prev: 35_400 },
  { h: "10", now: 58_900, prev: 49_200 }, { h: "11", now: 66_300, prev: 61_000 }, { h: "12", now: 92_100, prev: 78_600 },
  { h: "13", now: 88_400, prev: 81_900 }, { h: "14", now: 71_500, prev: 66_000 }, { h: "15", now: 64_800, prev: 59_300 },
  { h: "16", now: 0, prev: 70_100 }, { h: "17", now: 0, prev: 96_400 }, { h: "18", now: 0, prev: 112_800 },
  { h: "19", now: 0, prev: 98_300 }, { h: "20", now: 0, prev: 61_200 },
].map((d) => ({ ...d, now: d.now || null }));

export const daily = ["15/11", "16/11", "17/11", "18/11", "19/11", "20/11", "21/11"].map((d, i) => ({
  h: d, now: [842_000, 918_400, 776_200, 801_900, 865_300, 1_024_600, 997_450][i], prev: [790_100, 845_000, 760_400, 772_800, 829_900, 951_300, 940_200][i],
}));

export const paymentMix = [
  { name: "Cash", value: 412_600, color: "#0B1E4F" },
  { name: "Card", value: 286_900, color: "#FF7A00" },
  { name: "LankaQR", value: 184_300, color: "#FFA940" },
  { name: "Credit", value: 72_150, color: "#B9DDF7" },
  { name: "Gift Card", value: 41_500, color: "#1A3170" },
];

export const catSales = [
  { name: "Dairy", value: 248_600 }, { name: "Grocery", value: 212_300 }, { name: "Beverages", value: 168_900 },
  { name: "Snacks", value: 131_400 }, { name: "Household", value: 98_200 }, { name: "Personal Care", value: 76_800 }, { name: "Tea & Coffee", value: 61_250 },
];

export const notifications = [
  { id: 1, type: "Stock Alerts", icon: "PackageMinus", tone: "warning", msg: "Kotmale Fresh Milk 1L is below reorder level (7 left) at Colombo 03", time: "4 min ago", action: "Create PO", unread: true },
  { id: 2, type: "Sales", icon: "BadgePercent", tone: "danger", msg: "Sale INV-C03-018431 voided by Kasun J. (manager approved: Dilani F.)", time: "18 min ago", action: "View order", unread: true },
  { id: 3, type: "System", icon: "RefreshCw", tone: "info", msg: "Kurunegala · Terminal 2 synced 12 offline sales", time: "26 min ago", action: "View terminal", unread: true },
  { id: 4, type: "Stock Alerts", icon: "CalendarClock", tone: "warning", msg: "14 batches expire within 30 days (Highland Yoghurt, Kist Jam…)", time: "1 h ago", action: "Review batches", unread: false },
  { id: 5, type: "Sales", icon: "TrendingUp", tone: "success", msg: "Colombo 03 passed Rs. 400,000 in sales today — 12% ahead of last Saturday", time: "2 h ago", action: "Open dashboard", unread: false },
  { id: 6, type: "System", icon: "Printer", tone: "danger", msg: "Kandy · Terminal 1 receipt printer is out of paper", time: "3 h ago", action: "Hardware", unread: false },
];

export const expenseCats = ["Rent", "Utilities – CEB/Water", "Salaries", "Transport", "Maintenance", "Marketing", "Other"];
