# Google Apps Script Setup Instructions

This guide will help you set up Google Apps Script to collect and display orders from your Munson's Chocolate website.

## Part 1: Order Collection Script Setup

### Step 1: Create the Collection Script
1. Go to [Google Apps Script](https://script.google.com)
2. Click **"New Project"**
3. Name it "Munson's Chocolate - Order Collection"
4. Delete any default code
5. Copy the entire contents of `google-apps-script-collect.js` and paste it into the editor
6. Click the **Save** icon (💾)

### Step 2: Deploy the Collection Script
1. Click **"Deploy"** > **"New deployment"**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Configure the deployment:
   - **Description:** "Order Collection API"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **"Deploy"**
6. **IMPORTANT:** Copy the **Web App URL** - you'll need this later
7. Click **"Done"**

### Step 3: Test the Collection Script
1. In the script editor, select the function dropdown (next to Debug)
2. Choose `testOrderCollection`
3. Click **Run** (▶️)
4. The first time, you'll need to authorize the script:
   - Click **"Review permissions"**
   - Choose your Google account
   - Click **"Advanced"** > **"Go to Munson's Chocolate - Order Collection (unsafe)"**
   - Click **"Allow"**
5. Check the **Execution log** - it should show "success"
6. Run the function `getSpreadsheetUrl` to get the link to your spreadsheet
7. Open the spreadsheet - you should see a test order

---

## Part 2: Order Display Script Setup

### Step 1: Add the Display Script
1. In the same Google Apps Script project
2. Click the **"+"** next to "Files"
3. Choose **"Script"**
4. Name it "DisplayOrders"
5. Copy the entire contents of `google-apps-script-display.js` and paste it
6. Click **Save** (💾)

### Step 2: Deploy the Display Script
1. Click **"Deploy"** > **"New deployment"**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **"Web app"**
4. Configure the deployment:
   - **Description:** "Order Display API"
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone (or "Anyone with a Google account" for more security)
5. Click **"Deploy"**
6. **IMPORTANT:** Copy this **Web App URL** - you'll need this too
7. Click **"Done"**

### Step 3: Test the Display Script
1. In the script editor, select `testOrderDisplay` from the function dropdown
2. Click **Run** (▶️)
3. Check the **Execution log** - it should show your test order data

---

## Part 3: Update Your Website Files

### Step 1: Update checkout.js
Open `checkout.js` and update the `saveOrder` function to send data to Google Sheets:

```javascript
// Save order data to Google Sheets via Google Apps Script
function saveOrder(orderData) {
    // Add admin identifier to order
    orderData.adminAccount = 'rjsbackpack@gmail.com';
    
    // Get existing orders (keep local backup)
    let orders = JSON.parse(localStorage.getItem('munsonOrders') || '[]');
    orders.push(orderData);
    localStorage.setItem('munsonOrders', JSON.stringify(orders));
    
    // Send to Google Sheets
    const COLLECTION_URL = 'YOUR_COLLECTION_WEB_APP_URL_HERE'; // Replace with your URL from Part 1
    
    fetch(COLLECTION_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    }).then(() => {
        console.log('Order sent to Google Sheets');
    }).catch(error => {
        console.error('Error sending to Google Sheets:', error);
    });
}
```

### Step 2: Update admin.js
Add a function to load orders from Google Sheets. Add this near the top of `admin.js`:

```javascript
const DISPLAY_URL = 'YOUR_DISPLAY_WEB_APP_URL_HERE'; // Replace with your URL from Part 2

// Load orders from Google Sheets
async function loadOrdersFromSheets() {
    const adminEmail = sessionStorage.getItem('adminEmail');
    
    try {
        const response = await fetch(`${DISPLAY_URL}?adminEmail=${encodeURIComponent(adminEmail)}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Convert sheet format to website format
            allOrders = data.orders.map(order => ({
                orderNumber: order['Order Number'],
                date: order['Date'],
                customer: {
                    name: order['Customer Name'],
                    email: order['Customer Email'],
                    phone: order['Customer Phone']
                },
                items: parseItemsString(order['Items']),
                total: order['Total Amount'].toString().replace('$', ''),
                adminAccount: order['Admin Account']
            }));
            
            displayOrders(allOrders);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading orders from Google Sheets:', error);
        // Fall back to localStorage
        loadOrders();
    }
}

// Helper function to parse items string
function parseItemsString(itemsStr) {
    // This is a simplified parser - adjust based on your needs
    const items = {};
    // Parse the items string format from Google Sheets
    return items;
}
```

Then update the `loadOrders()` function call to use `loadOrdersFromSheets()` instead.

---

## Part 4: Get Your Web App URLs

### Collection URL (from Part 1, Step 2)
- Format: `https://script.google.com/macros/s/XXXXXXXXXXXXX/exec`
- Use this in: `checkout.js`

### Display URL (from Part 2, Step 2)
- Format: `https://script.google.com/macros/s/YYYYYYYYYYYYY/exec`
- Use this in: `admin.js`

---

## Part 5: View Your Orders Spreadsheet

Run the `getSpreadsheetUrl` function in the Collection script to get the direct link to your Google Sheets spreadsheet where all orders are stored.

You can:
- Share this spreadsheet with other admins
- Create charts and reports
- Export data to Excel
- Set up email notifications when new orders arrive

---

## Troubleshooting

### "Script has not been published" error
- Make sure you deployed as a **Web app**, not just saved the script
- Check that "Who has access" is set to "Anyone"

### Orders not appearing
- Check the Execution log in Apps Script for errors
- Verify the Web App URLs are correct in your website code
- Make sure you're using the admin email: `rjsbackpack@gmail.com`

### CORS errors in browser console
- This is normal with `mode: 'no-cors'`
- Orders are still being saved; you just can't read the response

---

## Security Note

The current setup allows anyone to submit orders (for customers) but filters orders by admin account. For production use, consider:
- Using Google Sign-In on your website
- Adding API keys or tokens
- Restricting "Who has access" to specific Google accounts
- Adding rate limiting to prevent spam

---

## Additional Features You Can Add

### Email Notifications
Add this to the Collection script after `sheet.appendRow(rowData)`:

```javascript
// Send email notification
MailApp.sendEmail({
  to: "rjsbackpack@gmail.com",
  subject: "New Munson's Chocolate Order: " + data.orderNumber,
  body: "New order received!\n\nOrder #: " + data.orderNumber + 
        "\nCustomer: " + data.customer.name +
        "\nTotal: $" + data.total
});
```

### Auto-backup
Set up a time-driven trigger to backup the spreadsheet daily.

---

## Support

If you need help, check:
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Apps Script Web Apps Guide](https://developers.google.com/apps-script/guides/web)
