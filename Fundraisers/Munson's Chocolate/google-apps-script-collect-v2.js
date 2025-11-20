/**
 * Google Apps Script - Order Collection v2.0 (UPDATED VERSION)
 * This script receives orders from the website and stores them in Google Sheets
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Open your existing project OR create a new one
 * 3. DELETE ALL existing code
 * 4. Copy this ENTIRE code and paste it
 * 5. Click the disk icon to Save
 * 6. Click Deploy > Manage Deployments
 * 7. Click the Edit icon (pencil) on your deployment
 * 8. Change "Version" to "New version"
 * 9. Click "Deploy"
 * 10. Copy the Web App URL and update it in checkout.js and admin.js
 */

// Configuration
const SPREADSHEET_NAME = "Munson's Chocolate Orders";
const SHEET_NAME = "Orders";

// Get or create the spreadsheet and sheet
function getOrdersSheet() {
  let spreadsheet;
  
  // Try to find existing spreadsheet
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
    Logger.log("Found existing spreadsheet");
  } else {
    // Create new spreadsheet
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    Logger.log("Created new spreadsheet: " + spreadsheet.getUrl());
  }
  
  // Get or create sheet
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
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#8B5A3C");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    
    Logger.log("Created new sheet with headers");
  }
  
  return sheet;
}

// Handle GET requests - Test endpoint
function doGet(e) {
  Logger.log("GET request received");
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      message: "Munson's Chocolate Order Collection API v2.0",
      timestamp: new Date().toISOString(),
      spreadsheetUrl: getSpreadsheetUrl()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests - Main endpoint
function doPost(e) {
  try {
    Logger.log("=== POST REQUEST RECEIVED ===");
    Logger.log("Raw postData: " + e.postData.contents);
    
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);
    Logger.log("Parsed data keys: " + Object.keys(data).join(", "));
    
    // Handle delete requests
    if (data.action === "deleteAllOrders") {
      Logger.log("Processing DELETE request");
      return handleDeleteOrders(data.adminEmail);
    }
    
    // Handle order submission
    Logger.log("Processing ORDER SUBMISSION");
    return handleOrderSubmission(data);
    
  } catch (error) {
    Logger.log("=== ERROR ===");
    Logger.log("Error message: " + error.toString());
    Logger.log("Error stack: " + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString(),
        stack: error.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle order submission
function handleOrderSubmission(data) {
  Logger.log("--- Starting order submission ---");
  
  // Detailed validation with logging
  if (!data.orderNumber) {
    Logger.log("ERROR: Missing orderNumber");
    throw new Error("Missing orderNumber");
  }
  Logger.log("Order number: " + data.orderNumber);
  
  if (!data.customer) {
    Logger.log("ERROR: Missing customer object");
    throw new Error("Missing customer information");
  }
  
  if (!data.customer.name) {
    Logger.log("ERROR: Missing customer name");
    throw new Error("Missing customer name");
  }
  Logger.log("Customer name: " + data.customer.name);
  
  if (!data.customer.email) {
    Logger.log("ERROR: Missing customer email");
    throw new Error("Missing customer email");
  }
  Logger.log("Customer email: " + data.customer.email);
  
  if (!data.items) {
    Logger.log("ERROR: Missing items");
    throw new Error("Missing items");
  }
  Logger.log("Items count: " + Object.keys(data.items).length);
  
  if (!data.total) {
    Logger.log("ERROR: Missing total");
    throw new Error("Missing total");
  }
  Logger.log("Total: " + data.total);
  
  Logger.log("Validation passed ✓");
  
  // Get the sheet
  const sheet = getOrdersSheet();
  Logger.log("Got sheet: " + sheet.getName());
  
  // Format items list
  let itemsList = "";
  let itemCount = 0;
  for (let itemId in data.items) {
    const item = data.items[itemId];
    itemsList += `${item.name} (x${item.quantity} @ $${item.price}); `;
    itemCount++;
  }
  Logger.log("Formatted " + itemCount + " items");
  
  // Clean up total (remove $ if present)
  const cleanTotal = data.total.toString().replace('$', '');
  
  // Prepare row data
  const rowData = [
    data.orderNumber,
    data.date || new Date().toLocaleString(),
    data.customer.name,
    data.customer.email,
    data.customer.phone || "N/A",
    itemsList.trim(),
    "$" + cleanTotal,
    data.adminAccount || "N/A",
    new Date().toISOString()
  ];
  
  Logger.log("Row data prepared with " + rowData.length + " columns");
  
  // Append to sheet
  try {
    sheet.appendRow(rowData);
    Logger.log("✓ Row appended successfully to row " + sheet.getLastRow());
  } catch (appendError) {
    Logger.log("ERROR appending row: " + appendError.toString());
    throw appendError;
  }
  
  // Auto-resize columns (non-critical)
  try {
    sheet.autoResizeColumns(1, 9);
    Logger.log("✓ Columns resized");
  } catch (resizeError) {
    Logger.log("Warning: Column resize failed (non-critical): " + resizeError);
  }
  
  Logger.log("=== ORDER SAVED SUCCESSFULLY ===");
  
  // Send success response
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      message: "Order saved successfully",
      orderNumber: data.orderNumber,
      timestamp: new Date().toISOString(),
      rowNumber: sheet.getLastRow()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle delete orders request
function handleDeleteOrders(adminEmail) {
  Logger.log("--- Starting delete operation ---");
  Logger.log("Admin email: " + adminEmail);
  
  if (!adminEmail) {
    Logger.log("ERROR: No admin email provided");
    throw new Error("Admin email required for delete operation");
  }
  
  const sheet = getOrdersSheet();
  const data = sheet.getDataRange().getValues();
  Logger.log("Total rows in sheet: " + data.length);
  
  // Find admin account column index (0-based)
  const headers = data[0];
  const adminColumnIndex = headers.indexOf("Admin Account");
  
  if (adminColumnIndex === -1) {
    Logger.log("ERROR: Admin Account column not found");
    Logger.log("Available columns: " + headers.join(", "));
    throw new Error("Admin Account column not found");
  }
  
  Logger.log("Admin column found at index: " + adminColumnIndex);
  
  // Delete rows in reverse order to avoid index shifting
  let deletedCount = 0;
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][adminColumnIndex] === adminEmail) {
      Logger.log("Deleting row " + (i + 1) + ": " + data[i][0]);
      sheet.deleteRow(i + 1); // +1 because sheets are 1-indexed
      deletedCount++;
    }
  }
  
  Logger.log("✓ Deleted " + deletedCount + " orders");
  Logger.log("=== DELETE COMPLETED ===");
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      message: "Orders deleted successfully",
      deletedCount: deletedCount,
      adminEmail: adminEmail
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get spreadsheet URL
function getSpreadsheetUrl() {
  try {
    const sheet = getOrdersSheet();
    return sheet.getParent().getUrl();
  } catch (error) {
    return "Error getting URL: " + error.toString();
  }
}

// === TEST FUNCTIONS ===

// Test function - Run this to verify setup and submit test order
function testOrderSubmission() {
  Logger.log("=== RUNNING TEST ORDER SUBMISSION ===");
  
  const testData = {
    orderNumber: "TEST" + Date.now(),
    date: new Date().toLocaleString(),
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "555-0123"
    },
    items: {
      "1": {
        name: "Milk Chocolate Bar",
        price: 1.75,
        quantity: 2
      },
      "2": {
        name: "Peanut Butter Cups",
        price: 7.49,
        quantity: 1
      }
    },
    total: "10.99",
    adminAccount: "rjsbackpack@gmail.com"
  };
  
  Logger.log("Test order data: " + JSON.stringify(testData));
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log("Test result: " + result.getContent());
  
  // Also log spreadsheet URL
  const url = getSpreadsheetUrl();
  Logger.log("Spreadsheet URL: " + url);
  Logger.log("=== TEST COMPLETE - CHECK YOUR SPREADSHEET ===");
  
  return url;
}

// Run this function to get your spreadsheet URL
function logSpreadsheetUrl() {
  const url = getSpreadsheetUrl();
  Logger.log("==============================================");
  Logger.log("Your spreadsheet URL:");
  Logger.log(url);
  Logger.log("==============================================");
  return url;
}

// Test delete function
function testDeleteOrders() {
  Logger.log("=== TESTING DELETE FUNCTION ===");
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: "deleteAllOrders",
        adminEmail: "rjsbackpack@gmail.com"
      })
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log("Delete result: " + result.getContent());
  Logger.log("=== DELETE TEST COMPLETE ===");
}
