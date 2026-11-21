export type Lang = "en" | "si" | "ta";

export const LANGS: { id: Lang; short: string; label: string }[] = [
  { id: "en", short: "EN", label: "English" },
  { id: "si", short: "සිං", label: "සිංහල" },
  { id: "ta", short: "த", label: "தமிழ்" },
];

type Dict = Record<string, [string, string, string]>; // [en, si, ta]

const D: Dict = {
  // nav groups
  "g.sell": ["Sell", "විකිණීම", "விற்பனை"],
  "g.manage": ["Manage", "කළමනාකරණය", "நிர்வகி"],
  "g.money": ["Money", "මුදල්", "பணம்"],
  "g.insights": ["Insights", "විශ්ලේෂණ", "நுண்ணறிவு"],
  "g.admin": ["Admin", "පරිපාලනය", "நிர்வாகம்"],
  // nav items
  "n.pos": ["POS Terminal", "POS ටර්මිනලය", "POS முனையம்"],
  "n.orders": ["Orders", "ඇණවුම්", "ஆர்டர்கள்"],
  "n.returns": ["Returns", "ආපසු භාර ගැනීම්", "திருப்பங்கள்"],
  "n.tables": ["Tables & Kitchen", "මේස සහ මුළුතැන්ගෙය", "மேசைகள் & சமையலறை"],
  "n.products": ["Products", "භාණ්ඩ", "பொருட்கள்"],
  "n.inventory": ["Inventory", "තොග", "சரக்கு"],
  "n.purchasing": ["Purchasing", "මිලදී ගැනීම්", "கொள்முதல்"],
  "n.customers": ["Customers", "පාරිභෝගිකයින්", "வாடிக்கையாளர்கள்"],
  "n.promotions": ["Promotions", "ප්‍රවර්ධන", "சலுகைகள்"],
  "n.register": ["Cash Register & Shifts", "මුදල් ලාච්චුව සහ මාරු", "காசுப்பெட்டி & பணிநேரம்"],
  "n.expenses": ["Expenses", "වියදම්", "செலவுகள்"],
  "n.payments": ["Payments & Credit", "ගෙවීම් සහ ණය", "கொடுப்பனவு & கடன்"],
  "n.dashboard": ["Dashboard", "උපකරණ පුවරුව", "டாஷ்போர்டு"],
  "n.reports": ["Reports", "වාර්තා", "அறிக்கைகள்"],
  "n.staff": ["Staff & Roles", "කාර්ය මණ්ඩලය සහ භූමිකා", "ஊழியர்கள் & பாத்திரங்கள்"],
  "n.branches": ["Branches & Terminals", "ශාඛා සහ ටර්මිනල", "கிளைகள் & முனையங்கள்"],
  "n.settings": ["Settings", "සැකසුම්", "அமைப்புகள்"],
  "n.audit": ["Audit Log", "විගණන සටහන", "தணிக்கைப் பதிவு"],
  "n.help": ["Help & Support", "උදව් සහ සහාය", "உதவி & ஆதரவு"],
  // top bar
  "t.search": ["Search products, orders, customers…", "භාණ්ඩ, ඇණවුම්, පාරිභෝගිකයින් සොයන්න…", "பொருட்கள், ஆர்டர்கள், வாடிக்கையாளர்களைத் தேடு…"],
  "t.synced": ["Synced", "සමමුහුර්තයි", "ஒத்திசைந்தது"],
  "t.syncing": ["Syncing 12…", "සමමුහුර්ත වෙමින් 12…", "ஒத்திசைகிறது 12…"],
  "t.offline": ["Offline – sales saved locally", "නොබැඳි – විකුණුම් දේශීයව සුරැකේ", "இணைப்பில்லை – விற்பனை சேமிக்கப்பட்டது"],
  // POS
  "p.search": ["Scan barcode or search product…", "බාර්කෝඩය ස්කෑන් කරන්න හෝ භාණ්ඩය සොයන්න…", "பார்கோடை ஸ்கேன் செய்யவும் அல்லது பொருளைத் தேடவும்…"],
  "p.all": ["All", "සියල්ල", "அனைத்தும்"],
  "p.fav": ["Quick keys", "ඉක්මන් යතුරු", "விரைவு விசைகள்"],
  "p.walkin": ["Walk-in Customer", "සාමාන්‍ය පාරිභෝගිකයා", "நேரடி வாடிக்கையாளர்"],
  "p.subtotal": ["Subtotal", "උප එකතුව", "உப மொத்தம்"],
  "p.discount": ["Discount", "වට්ටම", "தள்ளுபடி"],
  "p.tax": ["VAT (18%, incl.)", "වැට් (18%, ඇතුළත්)", "VAT (18%, உள்ளடங்கும்)"],
  "p.items": ["Total items", "මුළු අයිතම", "மொத்த பொருட்கள்"],
  "p.total": ["Grand Total", "මුළු මුදල", "மொத்தத் தொகை"],
  "p.hold": ["Hold", "රඳවන්න", "நிறுத்து"],
  "p.note": ["Note", "සටහන", "குறிப்பு"],
  "p.clear": ["Clear", "ඉවත් කරන්න", "அழி"],
  "p.charge": ["Charge", "අය කරන්න", "வசூலி"],
  "p.empty": ["Scan or tap a product to start a sale", "විකිණීමක් ආරම්භ කිරීමට භාණ්ඩයක් ස්කෑන් කරන්න හෝ තට්ටු කරන්න", "விற்பனையைத் தொடங்க ஒரு பொருளை ஸ்கேன் செய்யவும் அல்லது தொடவும்"],
  "p.instock": ["In stock", "තොගයේ ඇත", "கையிருப்பில்"],
  "p.low": ["Low", "අඩුයි", "குறைவு"],
  "p.out": ["Out", "අවසන්", "இல்லை"],
  "p.outofstock": ["Out of stock", "තොගය අවසන්", "கையிருப்பில் இல்லை"],
  "p.options": ["Options", "විකල්ප", "விருப்பங்கள்"],
  "p.coupon": ["Coupon", "කූපනය", "கூப்பன்"],
  "p.held": ["Held", "රඳවා ඇති", "நிறுத்தியவை"],
  "p.cashier": ["Cashier", "මුදල් අයකැමි", "காசாளர்"],
  "p.shift": ["Shift", "මාරුව", "பணிநேரம்"],
  "p.points": ["pts", "ලකුණු", "புள்ளிகள்"],
  "p.credit": ["Credit", "ණය", "கடன்"],
  "pay.cash": ["Cash", "මුදල්", "பணம்"],
  "pay.card": ["Card", "කාඩ්පත", "அட்டை"],
  "pay.qr": ["LankaQR", "LankaQR", "LankaQR"],
  "pay.credit": ["Credit", "ණය ගිණුම", "கடன்"],
  "pay.gift": ["Gift Card", "තෑගි කාඩ්පත", "பரிசு அட்டை"],
  "pay.split": ["Split", "බෙදා ගෙවීම", "பிரித்து"],
  "pay.tendered": ["Tendered", "ලැබුණු මුදල", "பெற்றது"],
  "pay.change": ["Change Due", "ඉතිරි මුදල", "மீதி"],
  "pay.complete": ["Complete Sale", "විකිණීම සම්පූර්ණ කරන්න", "விற்பனையை முடி"],
  "pay.exact": ["Exact", "හරියටම", "சரியாக"],
  "done.title": ["Sale complete", "විකිණීම සම්පූර්ණයි", "விற்பனை முடிந்தது"],
  "done.new": ["New Sale", "නව විකිණීම", "புதிய விற்பனை"],
  "done.receipt": ["How would the customer like the receipt?", "රිසිට්පත ලබා දිය යුත්තේ කෙසේද?", "ரசீதை எப்படி வழங்க வேண்டும்?"],
  "r.thanks": ["Thank you, come again!", "ස්තූතියි, නැවත එන්න!", "நன்றி, மீண்டும் வருக!"],
};

const idx: Record<Lang, number> = { en: 0, si: 1, ta: 2 };

export function translate(lang: Lang, key: string): string {
  const row = D[key];
  return row ? row[idx[lang]] : key;
}

export const fontClassFor = (lang: Lang) => (lang === "si" ? "lang-si" : lang === "ta" ? "lang-ta" : "");
