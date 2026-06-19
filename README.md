# Family Tree Angular Application

A modern Angular application for visualizing and managing generational family trees with 3D canvas capabilities (planned).

## Features

- **Dashboard Page**: Interactive control panel for family tree operations
- **API Integration**: Seamless connection with Laravel backend
- **Person Selection**: Click on any person card to select them globally
- **Nested Family Structure**: Display complex family relationships with marriages and children
- **Relationship Finder**: Find common ancestors between two family members
- **3D Tree View**: Placeholder for future 3D canvas implementation

## Tech Stack

- Angular 19 (Standalone Components)
- TypeScript 5.6
- RxJS 7.8
- Signal-based state management
- HttpClient for API communication

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Laravel backend API running

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   
   Open `src/app/services/family-tree.service.ts` and update the `apiUrl`:
   ```typescript
   private apiUrl = 'http://localhost:8000/api'; // Change to your Laravel API URL
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:4200`

## Laravel Backend Setup

Ensure your Laravel API has the following routes configured:

```php
Route::get('/dashboard', [DashboardController::class, 'indexApi']);
Route::get('/person-profile/{id}', [DashboardController::class, 'personProfile']);
Route::get('/persons', [DashboardController::class, 'persons']);
```

### CORS Configuration

If your Angular app and Laravel API are on different domains/ports, configure CORS in Laravel:

**config/cors.php:**
```php
'paths' => ['api/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:4200'],
'allowed_headers' => ['*'],
'exposed_headers' => ['Content-Encoding'],
```

## Usage

### Dashboard Page

The dashboard automatically loads on application start and displays:

1. **Control Panel** with three main sections:
   - **Load Family Tree**: Fetches complete family tree from `/dashboard`
   - **Load Person Profile**: Loads detailed profile for selected person
   - **Find Relationship**: Finds common ancestor between two people

2. **Family Tree Display**: Shows nested family structure with:
   - Person cards (color-coded by gender)
   - Marriage relationships
   - Children grouped by parent marriages
   - Click any card to select that person

3. **Person Profile Display**: Shows detailed profile when loaded

### Person Selection

- Click on any person card in the family tree
- The selected person is stored globally using Angular signals
- Use "Load Person Profile" button to fetch full details
- Selected person's ID is used for API calls

### Finding Relationships

1. Enter two person IDs in the input fields
2. Select language (English, Armenian, or Russian)
3. Click "Find Relationship"
4. View common ancestor and relationship details

## API Response Structure

### Dashboard (`/dashboard`)
Returns gzipped JSON of complete family tree with nested structure including marriages and children.

### Person Profile (`/person-profile/{id}`)
```typescript
{
  id: number;
  name: string;
  surname?: string;
  gender: 'male' | 'female';
  birth_date?: string;
  // ... other fields
}
```

### Persons Relationship (`/persons?first={id}&second={id}&lang={lang}`)
```typescript
{
  message: string;
  common_ancestor?: FamilyMember;
  relationship?: string;
  member1: FamilyMember;
  member2: FamilyMember;
}
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── person-card/          # Reusable person card component
│   │   └── family-tree-node/     # Recursive tree structure component
│   ├── models/
│   │   └── family-member.model.ts # TypeScript interfaces
│   ├── pages/
│   │   ├── dashboard/            # Main dashboard page
│   │   └── tree-view/            # 3D view placeholder
│   ├── services/
│   │   └── family-tree.service.ts # API service & state management
│   ├── app.component.ts          # Root component
│   └── app.routes.ts             # Route configuration
├── index.html
├── main.ts                        # Application bootstrap
└── styles.css                     # Global styles
```

## Building for Production

### Option 1: Separate Deployment

```bash
npm run build
```

Deploy the `dist/family-tree-app` folder to your web server or CDN.

### Option 2: Laravel Integration

1. Build the Angular app:
   ```bash
   npm run build
   ```

2. Copy contents of `dist/family-tree-app/browser` to Laravel's `public` folder

3. Configure Laravel routes to serve `index.html`:
   ```php
   Route::get('/{any}', function () {
       return view('index'); // or return file_get_contents(public_path('index.html'));
   })->where('any', '.*');
   ```

4. Update Angular `apiUrl` to use relative paths:
   ```typescript
   private apiUrl = '/api';
   ```

## Future Enhancements

- [ ] Implement 3D canvas visualization using Three.js
- [ ] Add authentication with Laravel Sanctum
- [ ] Implement drag-and-drop family tree editing
- [ ] Add photo upload for family members
- [ ] Export family tree as PDF/image
- [ ] Advanced search and filtering
- [ ] Timeline view of family events

## Development Commands

- `npm start` - Start dev server
- `npm run build` - Build for production
- `npm run watch` - Build and watch for changes
- `npm test` - Run unit tests

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private project - All rights reserved

## Support

For issues or questions, please contact the development team.
