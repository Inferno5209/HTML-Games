/**
 * Google Apps Script - Order Display
 * This script retrieves and displays orders from Google Sheets for the admin dashboard
 * 
 * SETUP INSTRUCTIONS:
 * 1. In the same Google Apps Script project as the collection script
 * 2. Add this code to a new file in the project
 * 3. OR create a separate project for read-only access
 * 4. Click "Deploy" > "New deployment"
 * 5. Choose "Web app" as deployment type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone" (or "Anyone with Google account" for more security)
 * 8. Click "Deploy" and copy the Web App URL
 * 9. Use this URL in your website's admin.js to fetch orders
 */

// Get the Orders spreadsheet
function getOrdersSheet() {
  const spreadsheetName = "Munson's Chocolate Orders";
  const sheetName = "Orders";
  
  const files = DriveApp.getFilesByName(spreadsheetName);
  
  if (!files.hasNext()) {
    throw new Error("Orders spreadsheet not found. Please run the collection script first.");
  }
  
  const spreadsheet = SpreadsheetApp.open(files.next());
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error("Orders sheet not found in spreadsheet.");
  }
  
  return sheet;
}

// Handle GET requests (retrieve orders)
function doGet(e) {
  try {
    // Get parameters
    const params = e.parameter;
    const adminEmail = params.adminEmail || null;
    const orderNumber = params.orderNumber || null;
    
    // Get the sheet
    const sheet = getOrdersSheet();
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    const headers = data[0];
    const rows = data.slice(1);
    
    // Convert to JSON objects
    let orders = rows.map(row => {
      let order = {};
      headers.forEach((header, index) => {
        order[header] = row[index];
      });
      return order;
    });
    
    // Filter by admin email if provided
    if (adminEmail) {
      orders = orders.filter(order => order["Admin Account"] === adminEmail);
    }
    
    // Filter by order number if provided
    if (orderNumber) {
      orders = orders.filter(order => order["Order Number"] === orderNumber);
    }
    
    // Sort by timestamp (newest first)
    orders.sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.Date);
      const dateB = new Date(b.Timestamp || b.Date);
      return dateB - dateA;
    });
    
    // Send response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: orders.length,
      orders: orders
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests (for authentication or filtered queries)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const adminEmail = data.adminEmail;
    
    // Verify admin credentials
    const validAdmins = ["rjsbackpack@gmail.com"]; // Add more admin emails here
    
    if (!validAdmins.includes(adminEmail)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Unauthorized access"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the sheet
    const sheet = getOrdersSheet();
    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    const rows = sheetData.slice(1);
    
    // Convert to JSON and filter
    let orders = rows.map(row => {
      let order = {};
      headers.forEach((header, index) => {
        order[header] = row[index];
      });
      return order;
    }).filter(order => order["Admin Account"] === adminEmail);
    
    // Sort by timestamp (newest first)
    orders.sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.Date);
      const dateB = new Date(b.Timestamp || b.Date);
      return dateB - dateA;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: orders.length,
      orders: orders
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify orders can be retrieved
function testOrderDisplay() {
  const mockEvent = {
    parameter: {
      adminEmail: "rjsbackpack@gmail.com"
    }
  };
  
  const result = doGet(mockEvent);
  Logger.log(result.getContent());
}

// Function to get order statistics
function getOrderStats(adminEmail) {
  try {
    const sheet = getOrdersSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    // Find column indices
    const adminAccountIndex = headers.indexOf("Admin Account");
    const totalIndex = headers.indexOf("Total Amount");
    const itemsIndex = headers.indexOf("Items");
    
    // Filter and calculate stats
    let totalOrders = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    
    rows.forEach(row => {
      if (row[adminAccountIndex] === adminEmail) {
        totalOrders++;
        
        // Parse total (remove $ if present)
        const amount = parseFloat(row[totalIndex].toString().replace('$', ''));
        if (!isNaN(amount)) {
          totalRevenue += amount;
        }
        
        // Count items (rough count based on semicolons)
        const itemsStr = row[itemsIndex].toString();
        const itemCount = (itemsStr.match(/x(\d+)/g) || [])
          .reduce((sum, match) => sum + parseInt(match.replace('x', '')), 0);
        totalItems += itemCount;
      }
    });
    
    return {
      totalOrders: totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      totalItems: totalItems
    };
    
  } catch (error) {
    Logger.log("Error calculating stats: " + error.toString());
    return {
      totalOrders: 0,
      totalRevenue: "0.00",
      totalItems: 0
    };
  }
}

// Endpoint to get statistics only
function doGetStats(e) {
  try {
    const adminEmail = e.parameter.adminEmail;
    
    if (!adminEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Admin email required"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const stats = getOrderStats(adminEmail);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      stats: stats
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
