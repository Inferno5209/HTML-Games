/**
 * Google Apps Script - Order Collection
 * This script receives orders from the website and stores them in Google Sheets
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project (name it "Munson's Chocolate Order System")
 * 3. Copy this ENTIRE code and paste it into the script editor
 * 4. Click the Save icon (disk icon)
 * 5. Click "Deploy" > "New deployment"
 * 6. Click the gear icon next to "Select type" and choose "Web app"
 * 7. Fill in the deployment settings:
 *    - Description: "Order Collection API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy"
 * 9. Authorize the app when prompted
 * 10. Copy the Web App URL and update it in your checkout.js file
 * 
 * SPREADSHEET SETUP:
 * - The script will automatically create a spreadsheet named "Munson's Chocolate Orders"
 * - It will be created in your Google Drive
 * - The spreadsheet will have proper headers and formatting
 */

// Configuration
const SPREADSHEET_NAME = "Munson's Chocolate Orders";
const SHEET_NAME = "Orders";

/**
 * Get or create the orders spreadsheet and sheet
 */
function getOrdersSheet() {
  let spreadsheet;
  
  // Try to find existing spreadsheet
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
    Logger.log("Found existing spreadsheet: " + spreadsheet.getUrl());
  } else {
    // Create new spreadsheet
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    Logger.log("Created new spreadsheet: " + spreadsheet.getUrl());
  }
  
  // Get or create the Orders sheet
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    
    // Set up headers
    const headers = [
      "Order Number",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Items",
      "Total Amount",
      "Admin Account",
      "Timestamp"
    ];
    
    // Write headers and format them
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#8B5A3C");
    headerRange.setFontColor("#FFFFFF");
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    Logger.log("Created new sheet with headers");
  }
  
  return sheet;
}

/**
 * Handle GET requests - Test endpoint to verify script is running
 */
function doGet(e) {
  Logger.log("GET request received - Test endpoint");
  
  try {
    const sheet = getOrdersSheet();
    const spreadsheet = sheet.getParent();
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Munson's Chocolate Order Collection API is running",
        timestamp: new Date().toISOString(),
        spreadsheetUrl: spreadsheet.getUrl(),
        spreadsheetId: spreadsheet.getId()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Receive and store orders
 */
function doPost(e) {
  try {
    Logger.log("=== POST REQUEST RECEIVED ===");
    Logger.log("Raw postData: " + e.postData.contents);
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    Logger.log("Parsed data: " + JSON.stringify(data));
    
    // Validate required fields
    if (!data.orderNumber || !data.customer || !data.items || !data.total) {
      Logger.log("Missing required fields");
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Missing required fields: orderNumber, customer, items, or total"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the sheet
    const sheet = getOrdersSheet();
    
    // Format items for storage
    let itemsText = "";
    for (let itemId in data.items) {
      const item = data.items[itemId];
      itemsText += `${item.name} (x${item.quantity} @ $${item.price}); `;
    }
    
    // Ensure total is a number
    let totalAmount = data.total;
    if (typeof totalAmount === 'string') {
      totalAmount = totalAmount.replace('$', '').trim();
    }
    
    // Prepare row data
    const rowData = [
      data.orderNumber,
      data.date || new Date().toLocaleString(),
      data.customer.name,
      data.customer.email,
      data.customer.phone,
      itemsText,
      totalAmount,
      data.adminAccount || "rjsbackpack@gmail.com",
      new Date().toISOString()
    ];
    
    // Append the new order
    sheet.appendRow(rowData);
    
    Logger.log("Order saved successfully: " + data.orderNumber);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Order saved successfully",
        orderNumber: data.orderNumber
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to manually verify the script works
 * Run this from the script editor to test
 */
function testScript() {
  const testOrder = {
    orderNumber: "MUN" + Date.now().toString().slice(-8),
    date: new Date().toLocaleString(),
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "123-456-7890"
    },
    items: {
      "1": {
        name: "Milk Chocolate Bar",
        quantity: 2,
        price: 1.75
      },
      "2": {
        name: "Peanut Butter Cups",
        quantity: 1,
        price: 7.49
      }
    },
    total: "10.99",
    adminAccount: "rjsbackpack@gmail.com"
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testOrder)
    }
  };
  
  const result = doPost(e);
  Logger.log("Test result: " + result.getContent());
}
