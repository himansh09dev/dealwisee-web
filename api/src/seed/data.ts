import type { ProductInput } from "@pricepilot/contracts";

/*
 * DEVELOPMENT SEED DATA.
 * Products and photography are real (Unsplash License); the stores are
 * fictional and every price, offer and history point is illustrative.
 * No real people, credentials or personal data.
 */

export type SeedProduct = ProductInput & {
  /** Backdated so "Recently added" has a meaningful order. */
  createdAt: string;
  /** Weekly lowest totals before this week, oldest first. */
  history?: number[];
};

const unsplash = (id: string) => `https://unsplash.com/photos/${id}`;

export const seedProducts: SeedProduct[] = [
  {
    slug: "sony-wh-1000xm4",
    name: "WH-1000XM4 Wireless Noise Cancelling Headphones",
    brand: "Sony",
    category: "audio",
    summary: "Adaptive ANC · 30 h battery · Multipoint",
    description:
      "Over-ear wireless headphones with adaptive noise cancelling that adjusts to your surroundings, up to 30 hours of battery life with ANC on, and multipoint pairing for switching between a phone and a laptop.",
    image: {
      url: "/images/products/sony-wh-1000xm4.jpg",
      alt: "Black Sony over-ear headphones standing upright on a warm beige background",
      sourceUrl: unsplash("photo-1618366712010-f4ae9c647dcb"),
    },
    listPrice: 34999,
    createdAt: "2026-10-16T09:00:00.000Z",
    specs: [
      { label: "Type", value: "Over-ear, wireless" },
      { label: "Noise cancelling", value: "Adaptive ANC" },
      { label: "Battery", value: "Up to 30 h (ANC on)" },
      { label: "Weight", value: "254 g" },
      { label: "Connectivity", value: "Bluetooth 5.0, 3.5 mm" },
      { label: "Codecs", value: "SBC, AAC, LDAC" },
      { label: "Charging", value: "USB-C" },
    ],
    offers: [
      { storeId: "northline", price: 24800, shipping: 0, inStock: true },
      { storeId: "parcel", price: 24499, shipping: 900, inStock: true },
      { storeId: "voltmart", price: 25999, shipping: 0, inStock: true },
      { storeId: "harbor", price: 27999, shipping: 0, inStock: false },
    ],
    history: [29999, 29999, 28999, 27999, 27999, 29999, 27499, 26999, 27999, 26999, 25999],
  },
  {
    slug: "jbl-flip-5",
    name: "Flip 5 Portable Waterproof Speaker",
    brand: "JBL",
    category: "audio",
    summary: "IPX7 · 12 h playtime · PartyBoost",
    description:
      "A cylindrical Bluetooth speaker rated IPX7 against water, with around 12 hours of playtime and PartyBoost for pairing with other compatible JBL speakers.",
    image: {
      url: "/images/products/jbl-flip-5.jpg",
      alt: "Black JBL cylindrical speaker lying on a wooden surface",
      sourceUrl: unsplash("photo-1608043152269-423dbba4e7e1"),
    },
    listPrice: 12999,
    createdAt: "2026-09-22T09:00:00.000Z",
    specs: [
      { label: "Type", value: "Portable speaker" },
      { label: "Battery", value: "Up to 12 h" },
      { label: "Water resistance", value: "IPX7" },
      { label: "Weight", value: "540 g" },
      { label: "Connectivity", value: "Bluetooth 4.2" },
      { label: "Charging", value: "USB-C" },
    ],
    offers: [
      { storeId: "voltmart", price: 8999, shipping: 0, inStock: true },
      { storeId: "parcel", price: 9499, shipping: 0, inStock: true },
      { storeId: "northline", price: 9999, shipping: 0, inStock: true },
    ],
    history: [11999, 11999, 10999, 10999, 11499, 9999, 9999, 10499, 9999, 9499, 9499],
  },
  {
    slug: "samsung-galaxy-s21",
    name: "Galaxy S21 5G, 128 GB, Phantom Violet",
    brand: "Samsung",
    category: "phones",
    summary: '6.2" 120 Hz · Triple camera · Unlocked',
    description:
      "An unlocked 5G phone with a 6.2-inch 120 Hz AMOLED display, a triple rear camera and an IP68 rating for dust and water resistance.",
    image: {
      url: "/images/products/samsung-galaxy-s21.jpg",
      alt: "Violet Samsung Galaxy S21 shown from the back next to its retail box",
      sourceUrl: unsplash("photo-1610945265064-0e34e5519bbf"),
    },
    listPrice: 79999,
    createdAt: "2026-10-02T09:00:00.000Z",
    specs: [
      { label: "Display", value: '6.2" AMOLED, 120 Hz' },
      { label: "Storage", value: "128 GB" },
      { label: "Memory", value: "8 GB" },
      { label: "Battery", value: "4,000 mAh" },
      { label: "Weight", value: "169 g" },
      { label: "Water resistance", value: "IP68" },
      { label: "Connectivity", value: "5G, Wi-Fi 6, Bluetooth 5.0" },
      { label: "Charging", value: "USB-C" },
    ],
    offers: [
      { storeId: "northline", price: 54900, shipping: 0, inStock: true },
      { storeId: "voltmart", price: 56999, shipping: 0, inStock: true },
      { storeId: "harbor", price: 52999, shipping: 1500, inStock: true },
    ],
    history: [64999, 62999, 62999, 59999, 59999, 58999, 57999, 57999, 56999, 55999, 54900],
  },
  {
    slug: "apple-iphone-12",
    name: "iPhone 12, 64 GB",
    brand: "Apple",
    category: "phones",
    summary: '6.1" OLED · A14 Bionic · 5G',
    description:
      "A 6.1-inch OLED iPhone with the A14 Bionic chip, 5G connectivity and IP68 water resistance, in the 64 GB configuration.",
    image: {
      url: "/images/products/apple-iphone-12.jpg",
      alt: "iPhone 12 lying on a wooden table beside a pair of white earbuds",
      sourceUrl: unsplash("photo-1592899677977-9c10ca588bbd"),
    },
    listPrice: 59900,
    createdAt: "2026-09-08T09:00:00.000Z",
    specs: [
      { label: "Display", value: '6.1" OLED, 60 Hz' },
      { label: "Storage", value: "64 GB" },
      { label: "Processor", value: "A14 Bionic" },
      { label: "Battery", value: "Up to 17 h video" },
      { label: "Weight", value: "164 g" },
      { label: "Water resistance", value: "IP68" },
      { label: "Connectivity", value: "5G, Wi-Fi 6, Bluetooth 5.0" },
      { label: "Charging", value: "Lightning" },
    ],
    offers: [
      { storeId: "northline", price: 47900, shipping: 0, inStock: true },
      { storeId: "voltmart", price: 48900, shipping: 0, inStock: true },
      { storeId: "parcel", price: 46900, shipping: 1200, inStock: true },
    ],
    history: [49900, 49900, 48900, 48900, 48900, 49900, 48900, 47900, 48900, 48900, 47900],
  },
  {
    slug: "playstation-5",
    name: "PlayStation 5 Console",
    brand: "Sony",
    category: "gaming",
    summary: "825 GB SSD · 4K 120 Hz · DualSense",
    description:
      "Sony’s console with an 825 GB SSD for fast loading, output up to 4K at 120 Hz, an Ultra HD Blu-ray drive and the DualSense controller.",
    image: {
      url: "/images/products/playstation-5.jpg",
      alt: "Close-up of the white PlayStation 5 console panel with the PlayStation logo",
      sourceUrl: unsplash("photo-1606813907291-d86efa9b94db"),
    },
    listPrice: 49999,
    createdAt: "2026-10-12T09:00:00.000Z",
    specs: [
      { label: "Storage", value: "825 GB SSD" },
      { label: "Output", value: "Up to 4K 120 Hz" },
      { label: "Disc drive", value: "Ultra HD Blu-ray" },
      { label: "Weight", value: "4.5 kg" },
      { label: "Connectivity", value: "Wi-Fi 6, Bluetooth 5.1, Ethernet" },
    ],
    offers: [
      { storeId: "voltmart", price: 44999, shipping: 0, inStock: true },
      { storeId: "parcel", price: 45999, shipping: 0, inStock: true },
      { storeId: "harbor", price: 46999, shipping: 0, inStock: false },
      { storeId: "northline", price: 47999, shipping: 0, inStock: true },
    ],
    history: [49999, 49999, 49999, 47999, 47999, 49999, 49999, 47999, 46999, 49999, 47999],
  },
  {
    slug: "polaroid-onestep-2",
    name: "OneStep 2 i-Type Instant Camera",
    brand: "Polaroid",
    category: "cameras",
    summary: "Viewfinder · Self-timer · 60-day battery",
    description:
      "An analog instant camera that shoots on i-Type and 600 film, with an optical viewfinder, self-timer and a rechargeable battery.",
    image: {
      url: "/images/products/polaroid-onestep-2.jpg",
      alt: "White Polaroid OneStep 2 instant camera on a light grey surface",
      sourceUrl: unsplash("photo-1526170375885-4d8ecf77b99f"),
    },
    listPrice: 9999,
    createdAt: "2026-10-18T09:00:00.000Z",
    specs: [
      { label: "Film", value: "i-Type, 600" },
      { label: "Lens", value: "106 mm fixed focus" },
      { label: "Battery", value: "Rechargeable, about 60 days" },
      { label: "Weight", value: "460 g" },
      { label: "Self-timer", value: "Yes" },
      { label: "Charging", value: "Micro-USB" },
    ],
    offers: [
      { storeId: "northline", price: 8999, shipping: 0, inStock: true },
      { storeId: "parcel", price: 8299, shipping: 999, inStock: true },
      { storeId: "voltmart", price: 9499, shipping: 0, inStock: true },
    ],
    history: [9999, 9999, 9499, 9499, 9999, 9999, 9499, 9299, 9499, 9299, 9299],
  },
  {
    slug: "apple-watch-series-6",
    name: "Watch Series 6 GPS, 44 mm Aluminium",
    brand: "Apple",
    category: "wearables",
    summary: "Always-on Retina · Blood oxygen · Water resistant",
    description:
      "A 44 mm aluminium smartwatch with an always-on display, blood oxygen and ECG sensing, GPS, and water resistance to 50 metres.",
    image: {
      url: "/images/products/apple-watch-series-6.jpg",
      alt: "Apple Watch with a black sport band photographed from above on white",
      sourceUrl: unsplash("photo-1546868871-7041f2a55e12"),
    },
    listPrice: 39900,
    createdAt: "2026-09-30T09:00:00.000Z",
    specs: [
      { label: "Display", value: "Always-on Retina" },
      { label: "Case size", value: "44 mm aluminium" },
      { label: "Battery", value: "Up to 18 h" },
      { label: "Weight", value: "36.5 g" },
      { label: "Water resistance", value: "50 m" },
      { label: "Sensors", value: "Blood oxygen, ECG, heart rate" },
      { label: "Connectivity", value: "GPS, Wi-Fi, Bluetooth 5.0" },
    ],
    offers: [
      { storeId: "northline", price: 27900, shipping: 0, inStock: true },
      { storeId: "harbor", price: 26900, shipping: 0, inStock: false },
      { storeId: "voltmart", price: 28900, shipping: 0, inStock: true },
    ],
    history: [32900, 31900, 31900, 29900, 29900, 29900, 28900, 28900, 27900, 28900, 28900],
  },
  {
    slug: "macbook-pro-13",
    name: 'MacBook Pro 13", M2, 8 GB / 256 GB',
    brand: "Apple",
    category: "computing",
    summary: "Apple M2 · 20 h battery · Touch Bar",
    description:
      "A 13-inch laptop with the Apple M2 chip, 8 GB of memory and a 256 GB SSD, rated for up to 20 hours of video playback.",
    image: {
      url: "/images/products/macbook-pro-13.jpg",
      alt: "Open MacBook Pro keyboard lit by purple and blue light",
      sourceUrl: unsplash("photo-1517336714731-489689fd1ca8"),
    },
    listPrice: 129900,
    createdAt: "2026-10-09T09:00:00.000Z",
    specs: [
      { label: "Display", value: '13.3" Retina, 2560 × 1600' },
      { label: "Processor", value: "Apple M2" },
      { label: "Memory", value: "8 GB" },
      { label: "Storage", value: "256 GB SSD" },
      { label: "Battery", value: "Up to 20 h video" },
      { label: "Weight", value: "1.4 kg" },
      { label: "Connectivity", value: "Wi-Fi 6, Bluetooth 5.0" },
      { label: "Ports", value: "2 × Thunderbolt / USB 4" },
    ],
    offers: [
      { storeId: "northline", price: 109900, shipping: 0, inStock: true },
      { storeId: "parcel", price: 107900, shipping: 2500, inStock: true },
      { storeId: "voltmart", price: 112900, shipping: 0, inStock: true },
      { storeId: "harbor", price: 114900, shipping: 0, inStock: true },
    ],
    history: [
      119900, 119900, 117900, 114900, 114900, 112900, 112900, 114900, 112900, 109900, 109900,
    ],
  },
  {
    slug: "nike-air-max-1",
    name: "Air Max 1 Ultra Essential",
    brand: "Nike",
    category: "footwear",
    summary: "Visible Air cushioning · Mesh upper",
    description:
      "A lifestyle sneaker with a visible Max Air unit in the heel and a mesh and synthetic upper.",
    image: {
      url: "/images/products/nike-air-max-1.jpg",
      alt: "White and bright orange Nike Air Max 1 sneaker suspended against a pale grey backdrop",
      sourceUrl: unsplash("photo-1600185365483-26d7a4cc7519"),
    },
    listPrice: 14000,
    createdAt: "2026-10-05T09:00:00.000Z",
    specs: [
      { label: "Upper", value: "Mesh and synthetic" },
      { label: "Cushioning", value: "Visible Max Air unit" },
      { label: "Closure", value: "Lace-up" },
      { label: "Use", value: "Lifestyle" },
    ],
    offers: [
      { storeId: "parcel", price: 11200, shipping: 600, inStock: true },
      { storeId: "northline", price: 12600, shipping: 0, inStock: true },
      { storeId: "harbor", price: 13000, shipping: 0, inStock: true },
    ],
    history: [14000, 14000, 14000, 13000, 13000, 12600, 12600, 12600, 14000, 12600, 12600],
  },
  {
    slug: "nike-free-rn-flyknit",
    name: "Free RN Flyknit Running Shoe",
    brand: "Nike",
    category: "footwear",
    summary: "Flyknit upper · Flexible sole · Neutral",
    description:
      "A lightweight road-running shoe with a Flyknit upper and a flexible foam sole designed to move with the foot.",
    image: {
      url: "/images/products/nike-free-rn-flyknit.jpg",
      alt: "Red Nike Free RN Flyknit running shoe on a red background",
      sourceUrl: unsplash("photo-1542291026-7eec264c27ff"),
    },
    listPrice: 12000,
    createdAt: "2026-09-14T09:00:00.000Z",
    specs: [
      { label: "Upper", value: "Flyknit" },
      { label: "Cushioning", value: "Foam midsole" },
      { label: "Closure", value: "Lace-up" },
      { label: "Use", value: "Road running" },
    ],
    offers: [
      { storeId: "northline", price: 8400, shipping: 0, inStock: true },
      { storeId: "parcel", price: 7900, shipping: 600, inStock: true },
      { storeId: "harbor", price: 8999, shipping: 0, inStock: true },
    ],
    history: [12000, 10800, 10800, 9600, 9600, 9600, 9000, 9000, 9000, 8999, 8999],
  },
  {
    slug: "baratza-encore",
    name: "Encore Conical Burr Coffee Grinder",
    brand: "Baratza",
    category: "home",
    summary: "40 grind settings · 40 mm burrs",
    description:
      "An entry-level conical burr grinder with 40 grind settings, suitable for drip, pour-over and French press brewing.",
    image: {
      url: "/images/products/baratza-encore.jpg",
      alt: "Baratza Encore grinder on a granite kitchen counter beside a filter coffee brewer",
      sourceUrl: unsplash("photo-1570222094114-d054a817e56b"),
    },
    listPrice: 14995,
    createdAt: "2026-10-14T09:00:00.000Z",
    specs: [
      { label: "Burrs", value: "40 mm conical steel" },
      { label: "Grind settings", value: "40" },
      { label: "Hopper capacity", value: "227 g" },
      { label: "Motor", value: "DC, gear reduced" },
    ],
    offers: [
      { storeId: "harbor", price: 13999, shipping: 0, inStock: true },
      { storeId: "kettle", price: 14995, shipping: 0, inStock: true },
      { storeId: "northline", price: 14995, shipping: 0, inStock: true },
    ],
    history: [14995, 14995, 14995, 14995, 13999, 14995, 14995, 14995, 14995, 14995, 14995],
  },
  {
    slug: "ikea-hektar-floor-lamp",
    name: "HEKTAR Floor Lamp, Dark Grey",
    brand: "IKEA",
    category: "home",
    summary: "Adjustable shade · Steel · E26 bulb",
    description:
      "A steel floor lamp with an adjustable, tilting shade for directing light. The bulb is sold separately.",
    image: {
      url: "/images/products/ikea-hektar-floor-lamp.jpg",
      alt: "Dark grey IKEA HEKTAR floor lamp against a white wall",
      sourceUrl: unsplash("photo-1507473885765-e6ed057f782c"),
    },
    listPrice: 9999,
    createdAt: "2026-09-26T09:00:00.000Z",
    specs: [
      { label: "Height", value: "181 cm" },
      { label: "Material", value: "Steel" },
      { label: "Bulb", value: "E26, sold separately" },
      { label: "Adjustable", value: "Tilting shade" },
    ],
    offers: [
      { storeId: "kettle", price: 10999, shipping: 0, inStock: true },
      { storeId: "harbor", price: 11499, shipping: 0, inStock: true },
      { storeId: "northline", price: 11999, shipping: 0, inStock: true },
    ],
    history: [9999, 9999, 9999, 9999, 9999, 9999, 9999, 9999, 10499, 10499, 10499],
  },
  {
    slug: "ray-ban-wayfarer",
    name: "Original Wayfarer Classic Sunglasses",
    brand: "Ray-Ban",
    category: "accessories",
    summary: "Acetate frame · G-15 lenses · 50 mm",
    description:
      "The classic acetate Wayfarer frame with G-15 green lenses that block 100% of UVA and UVB light.",
    image: {
      url: "/images/products/ray-ban-wayfarer.jpg",
      alt: "Black Ray-Ban Wayfarer sunglasses on a white surface",
      sourceUrl: unsplash("photo-1572635196237-14b3f281503f"),
    },
    listPrice: 16300,
    createdAt: "2026-10-07T09:00:00.000Z",
    specs: [
      { label: "Frame", value: "Acetate" },
      { label: "Lens", value: "G-15 green, non-polarised" },
      { label: "Lens width", value: "50 mm" },
      { label: "Bridge", value: "22 mm" },
      { label: "UV protection", value: "100% UVA/UVB" },
    ],
    offers: [
      { storeId: "northline", price: 13040, shipping: 0, inStock: true },
      { storeId: "parcel", price: 12900, shipping: 700, inStock: true },
      { storeId: "voltmart", price: 14670, shipping: 0, inStock: true },
    ],
    history: [16300, 16300, 16300, 16300, 14670, 14670, 16300, 16300, 14670, 14670, 13040],
  },
];
