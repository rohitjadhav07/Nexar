# Nexar Screenshots

## 📸 How to Add Screenshots

### Required Screenshots:

1. **nexar-logo.png** (400x400px)
   - Nexar logo with transparent background
   - PNG format

2. **dashboard.png** (1920x1080px)
   - Main dashboard view
   - Show balance cards, recent transactions
   - Connected wallet state

3. **bluetooth-payment.png** (1920x1080px)
   - Bluetooth payment interface
   - Show merchant/customer mode selection
   - Connection status

4. **invoice-system.png** (1920x1080px)
   - Invoice creation form
   - QR code display
   - Shareable link

5. **analytics.png** (1920x1080px)
   - Analytics dashboard
   - Charts and metrics
   - Transaction history

### How to Capture:

```bash
# 1. Run the app locally
cd frontend
npm run dev

# 2. Open in browser
http://localhost:5173

# 3. Connect Freighter wallet

# 4. Navigate to each page and take screenshots

# 5. Save screenshots in this folder with exact names above
```

### Screenshot Guidelines:

- **Resolution**: 1920x1080px (Full HD)
- **Format**: PNG with transparency where applicable
- **Browser**: Use Chrome with no extensions visible
- **Theme**: Dark mode (default)
- **Data**: Use realistic test data
- **Wallet**: Show connected state
- **Quality**: High quality, no compression artifacts

### Tools:

- **Windows**: Snipping Tool, ShareX
- **Mac**: Cmd+Shift+4
- **Linux**: Flameshot, GNOME Screenshot
- **Browser**: Chrome DevTools (Cmd/Ctrl+Shift+P → "Capture screenshot")

### Optimization:

```bash
# Install imagemagick or use online tools
# Optimize PNG files to reduce size

# Example with imagemagick:
convert dashboard.png -quality 85 -resize 1920x1080 dashboard-optimized.png
```

---

## 🎨 Design Guidelines

### Colors:
- Background: `#0F172A` (slate-900)
- Cards: `#1E293B` (slate-800)
- Primary: `#3B82F6` (blue-500)
- Text: `#F1F5F9` (slate-100)
- Accent: `#6366F1` (indigo-500)

### Typography:
- Headings: Inter, Bold
- Body: Inter, Regular
- Code: JetBrains Mono

### Spacing:
- Consistent padding and margins
- Clean, modern layout
- Glassmorphism effects

---

## 📝 Current Status

- [ ] nexar-logo.png
- [ ] dashboard.png
- [ ] bluetooth-payment.png
- [ ] invoice-system.png
- [ ] analytics.png

**Note**: Add your screenshots here and update the checkboxes above.

---

## 🔄 Updating README

After adding screenshots, the README will automatically display them:

```markdown
![Dashboard](./docs/images/dashboard.png)
```

No code changes needed - just add the images!
