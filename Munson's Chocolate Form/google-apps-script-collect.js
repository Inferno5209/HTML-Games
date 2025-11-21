/**
 * Google Apps Script - Order Collection
 * This script receives orders from the website and stores them in Google Sheets
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Copy this code into the script editor
 * 4. Click "Deploy" > "New deployment"
 * 5. Choose "Web app" as deployment type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click "Deploy" and copy the Web App URL
 * 9. Use this URL in your website's checkout.js to submit orders
 */

// Create or get the Orders spreadsheet
function getOrdersSheet() {
  const spreadsheetName = "Munson's Chocolate Orders";
  const sheetName = "Orders";
  
  // Try to find existing spreadsheet
  let spreadsheet;
  const files = DriveApp.getFilesByName(spreadsheetName);
  
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    // Create new spreadsheet
    spreadsheet = SpreadsheetApp.create(spreadsheetName);
  }
  
  // Get or create sheet
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
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
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

// Handle GET requests (test endpoint)
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Munson's Chocolate Order Collection API is running",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Handle POST requests (receive orders and delete operations)
function doPost(e) {
  try {
    // Log received data for debugging
    Logger.log("Received data: " + e.postData.contents);
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Check if this is a delete request
    if (data.action === "deleteAllOrders") {
      const sheet = getOrdersSheet();
      const allData = sheet.getDataRange().getValues();
      const adminColumnIndex = 7; // 0-indexed (Admin Account column)
      
      // Loop through rows backwards to avoid index shifting
      for (let i = allData.length - 1; i > 0; i--) {
        if (allData[i][adminColumnIndex] === data.adminEmail) {
          sheet.deleteRow(i + 1); // +1 because sheets are 1-indexed
        }
      }
      
      Logger.log("Deleted all orders for: " + data.adminEmail);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All orders deleted successfully"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Regular order submission
    // Validate required fields
    if (!data.orderNumber || !data.customer || !data.items || !data.total) {
      Logger.log("Missing required fields");
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Missing required fields"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get the sheet
    const sheet = getOrdersSheet();
    
    // Format items list
    let itemsList = "";
    for (let itemId in data.items) {
      const item = data.items[itemId];
      itemsList += `${item.name} (x${item.quantity} @ $${item.price}); `;
    }
    
    // Prepare row data
    const rowData = [
      data.orderNumber,
      data.date || new Date().toLocaleString(),
      data.customer.name,
      data.customer.email,
      data.customer.phone,
      itemsList.trim(),
      '$' + data.total,
      data.adminAccount || "N/A",
      new Date().toISOString()
    ];
    
    // Append to sheet
    sheet.appendRow(rowData);
    
    // Auto-resize columns for better readability
    sheet.autoResizeColumns(1, 9);
    
    Logger.log("Order saved successfully: " + data.orderNumber);
    
    // Send success response
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Order saved successfully",
      orderNumber: data.orderNumber
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error
    Logger.log("Error: " + error.toString());
    
    // Send error response
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify setup
function testOrderCollection() {
  const testOrder = {
    orderNumber: "TEST001",
    date: new Date().toLocaleString(),
    customer: {
      name: "Test Customer",
      email: "test@example.com",
      phone: "555-1234"
    },
    items: {
      "1": {
        name: "Milk Chocolate Bar",
        price: 1.75,
        quantity: 2
      },
      "9": {
        name: "Peanut Butter Cups",
        price: 7.49,
        quantity: 1
      }
    },
    total: "10.99",
    adminAccount: "rjsbackpack@gmail.com"
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testOrder)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

// Function to get spreadsheet URL (run this to get the link)
function getSpreadsheetUrl() {
  const sheet = getOrdersSheet();
  const url = sheet.getParent().getUrl();
  Logger.log("Spreadsheet URL: " + url);
  return url;
}
