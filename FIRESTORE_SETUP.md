# Firestore Setup Guide

## Critical: Apply Firestore Rules

Your app can't save rides because Firestore security rules aren't configured. Here's how to fix it:

### Step 1: Go to Firebase Console
1. Visit https://console.firebase.google.com
2. Select your project: `loxurya-cfb98`

### Step 2: Apply Security Rules
1. In the left sidebar, click **Firestore Database**
2. Click the **Rules** tab at the top
3. Replace the current rules with the content from `firestore.rules` file in your project
4. Click **Publish** to apply the changes

### What These Rules Do:
- ✅ Allow users to create and read their own rides
- ✅ Allow drivers to see rides assigned to them
- ✅ Allow admins to manage everything
- ✅ Prevent unauthorized access
- ✅ Auto-create the "rides" collection on first write

### Step 3: Create a Composite Index (Optional)
If you get an error about missing indexes:

1. Click the **Indexes** tab
2. Click **Add Index**
3. Collection: `rides`
4. Fields to index:
   - `userId` (Ascending)
   - `createdAt` (Descending)
5. Click **Create**

---

## Testing the App

### Current Location
The app uses your browser's geolocation. When you open the booking form:
- Your browser will ask for location permission
- Click "Allow" to enable current location
- If blocked, check your browser's location settings

### Destination Autocomplete
Type at least 2 characters in "Where to?" field:
- Suggestions will appear from Google Places
- Click a suggestion to select it
- Coordinates are automatically fetched

---

## Troubleshooting

### "Failed to fetch rides"
- **Solution**: Apply Firestore rules (see Step 2 above)

### "Location not available"
- Check browser location permissions
- Make sure you're using HTTPS or localhost
- Some browsers block location on HTTP

### "Failed to load suggestions"
- Check browser console for detailed errors
- Verify Google Places API key is valid
- Check Supabase edge functions are deployed

### Empty suggestions list
- Type at least 2 characters
- Wait 300ms for debounce
- Check internet connection
