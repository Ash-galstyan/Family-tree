# Quick Start Guide

## 1. Install Dependencies
```bash
cd family-tree-app
npm install
```

## 2. Configure Laravel API URL

Edit `src/app/services/family-tree.service.ts` line 12:
```typescript
private apiUrl = 'http://localhost:8000/api'; // Change to your Laravel API URL
```

## 3. Enable CORS in Laravel

If running on different domains, add to `config/cors.php`:
```php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:4200'],
'exposed_headers' => ['Content-Encoding'],
```

And ensure middleware is enabled in `app/Http/Kernel.php`:
```php
protected $middleware = [
    // ...
    \Fruitcake\Cors\HandleCors::class,
];
```

## 4. Start the Application
```bash
npm start
```

Open browser at `http://localhost:4200`

## 5. Using the Application

### On Page Load:
- Dashboard automatically calls `/dashboard` API
- Family tree structure displays with all relationships

### Select a Person:
- Click on any person card in the tree
- Person becomes highlighted (purple border)
- Person is stored globally for other operations

### Load Person Profile:
- Select a person first (click their card)
- Click "Load Person Profile" button
- Calls `/person-profile/{id}` API
- Shows detailed profile below

### Find Relationship:
- Enter two person IDs in the input fields
- Select language (en/hy/ru)
- Click "Find Relationship"
- Calls `/persons?first={id}&second={id}&lang={lang}`
- Shows common ancestor and relationship

## File Structure Overview

```
family-tree-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── person-card/           → Reusable person card UI
│   │   │   └── family-tree-node/      → Recursive tree structure
│   │   ├── models/
│   │   │   └── family-member.model.ts → TypeScript interfaces
│   │   ├── pages/
│   │   │   ├── dashboard/             → Main dashboard (replaces Blade)
│   │   │   └── tree-view/             → 3D view placeholder
│   │   ├── services/
│   │   │   └── family-tree.service.ts → API calls + global state
│   │   ├── app.component.ts
│   │   └── app.routes.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Key Features

✅ **Automatic Dashboard Load**: Family tree loads on page initialization
✅ **Global Person Selection**: Click any card to select person (stored in signals)
✅ **API Integration**: All 3 Laravel endpoints connected
✅ **Nested Structure**: Same layout as Blade template with marriages & children
✅ **Responsive Design**: Works on desktop and mobile
✅ **Type Safety**: Full TypeScript interfaces for API responses
✅ **Signal-based State**: Modern Angular state management

## Troubleshooting

### CORS Error
Enable CORS in Laravel (see step 3 above)

### API 404 Error
Check that Laravel routes are registered and API URL is correct

### Gzip Encoding Issue
The `/dashboard` endpoint returns gzipped data. Angular HttpClient automatically handles decompression if the server sends `Content-Encoding: gzip` header.

### Empty Family Tree
Check browser console for errors and verify `/dashboard` returns valid JSON

## Next Steps

1. Test with your actual Laravel API
2. Customize styling in component CSS
3. Add authentication if needed
4. Implement 3D canvas visualization
5. Deploy to production
