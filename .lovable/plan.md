## EstateMart Full Implementation Plan

### 1. Database Setup (Migrations)
- **products** table: id, name, price, category, vendor, image_url, in_stock, description, created_at
- **orders** table: id, user_id, total, status, phone_number, mpesa_receipt, created_at
- **order_items** table: id, order_id, product_id, quantity, price
- Enable RLS with appropriate policies

### 2. M-Pesa Integration (Edge Function)
- Store M-Pesa credentials as secrets (consumer key, consumer secret, passkey, etc.)
- Create `mpesa-stk-push` edge function that:
  - Gets OAuth token from Safaricom
  - Initiates STK Push to customer's phone
  - Returns checkout request ID
- Create `mpesa-callback` edge function to receive payment confirmation and update order status

### 3. Vendor Product Management UI
- Admin/vendor page at `/vendor` to:
  - Add new products (name, price, category, image URL, stock status)
  - View existing products
  - Edit/delete products

### 4. Checkout Flow
- Cart drawer gets a phone number input for M-Pesa
- "Pay with M-Pesa" button triggers STK Push
- Order created in DB, status updated on callback
- Products now load from database instead of hardcoded array

### 5. Auth (Basic)
- Sign up / Sign in pages for residents and vendors
- Profile table for user info
