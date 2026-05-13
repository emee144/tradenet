# Tradenet

**Tradenet** is a modern mobile marketplace app built for Nigeria, starting from Ibadan. It allows users to easily buy and sell items such as phones, electronics, fashion, home goods, and more.

### ✨ Key Features

- **Unified Market Screen** – All categories (Phones, Electronics, Fashion, Home Goods) are now accessible from one central marketplace
- **Dedicated & Prominent Phones Section** – Special focus on the most popular category in Nigeria
- **Multiple Categories**:
  - Phones (Smartphones, Feature Phones, Tablets, Accessories)
  - Electronics (Laptops, TVs, Audio, Gaming)
  - Fashion (Clothing, Shoes, Bags, Watches & Jewelry)
  - Home Goods (Appliances, Furniture, Generators, Kitchenware)
- Beautiful **Dark Theme** with premium gold accents
- Multiple image uploads with preview
- Direct **Call & WhatsApp** seller contact
- My Listings – Manage, edit, toggle availability, and delete posts
- Advanced search and category filtering
- User authentication and profiles

### 🛠 Tech Stack

- **Frontend**: React Native + Expo (SDK 54)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **UI**: Custom dark + gold design system

### 📱 App Structure

- **Market Screen** → Main marketplace hub with category tabs
- **Phones** → Dedicated high-visibility section
- **Electronics**, **Fashion**, **Home Goods** → Integrated inside Market
- **My Listings** → Manage your posted items
- **Post Item** flows for each category

### 🚀 Current Status

- Fully functional marketplace with multiple categories
- Complete CRUD operations (Create, Read, Update, Delete)
- Image upload and storage integration
- Clean, consistent UI across all screens
- Ready for expansion (Properties, Vehicles, Jobs, etc.)

### Target Users

Vendors, students, traders, and individuals in Ibadan and across Nigeria looking for a simple, fast, and reliable platform to buy and sell quality items.

---

### Installation & Setup

```bash
git clone https://github.com/yourusername/tradenet.git
cd tradenet
npm install
npx expo start