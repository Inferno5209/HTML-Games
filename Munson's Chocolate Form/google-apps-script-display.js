/**
 * Google Apps Script - Order Display
 * This script retrieves orders from Google Sheets for the admin dashboard
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Open the SAME project as the collection script (or create a new one if you want separate access)
 * 3. Create a new file in the project: Click "+" next to "Files" and name it "Display"
 * 4. Copy this ENTIRE code and paste it into the new file
 * 5. Click the Save icon (disk icon)
 * 6. Click "Deploy" > "New deployment"
 * 7. Click the gear icon next to "Select type" and choose "Web app"
 * 8. Fill in the deployment settings:
 *    - Description: "Order Display API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 9. Click "Deploy"
 * 10. Copy the Web App URL and update it in your admin.js file (DISPLAY_URL variable)
 * 
 * NOTE: This script can be in the same project as the collection script.
 * Just deploy it as a separate web app from the same project.
 */

// Configuration
const SPREADSHEET_NAME = "Munson's Chocolate Orders";
const SHEET_NAME = "Orders";

/**
 * Get the orders spreadsheet and sheet
 */
function getOrdersSheet() {
  const files = DriveApp.getFilesByName(SPREADSHEET_NAME);
  
  if (!files.hasNext()) {
    throw new Error("Orders spreadsheet not found. Please run the collection script first to create the spreadsheet.");
  }
  
  const spreadsheet = SpreadsheetApp.open(files.next());
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Orders sheet not found in spreadsheet.");
  }
  
  return sheet;
}

/**
 * Handle GET requests - Retrieve orders based on filters
 */
function doGet(e) {
  try {
    Logger.log("=== GET REQUEST RECEIVED ===");
    
    // Get query parameters
    const params = e.parameter || {};
    const adminEmail = params.adminEmail || null;
    const orderNumber = params.orderNumber || null;
    
    Logger.log("Admin Email filter: " + adminEmail);
    Logger.log("Order Number filter: " + orderNumber);
    
    // Get the sheet
    const sheet = getOrdersSheet();
    
    // Get all data from the sheet
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    
    // Check if sheet has data
    if (data.length <= 1) {
      Logger.log("No orders found in sheet");
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          count: 0,
          orders: [],
          message: "No orders found"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get headers (first row)
    const headers = data[0];
    const rows = data.slice(1); // Skip header row
    
    Logger.log("Headers: " + headers.join(", "));
    Logger.log("Total rows: " + rows.length);
    
    // Convert rows to JSON objects
    let orders = rows.map(row => {
      let order = {};
      headers.forEach((header, index) => {
        order[header] = row[index] || "";
      });
      return order;
    });
    
    // Filter by admin email if provided
    if (adminEmail) {
      orders = orders.filter(order => {
        const orderAdmin = order["Admin Account"] || order["AdminAccount"] || "";
        return orderAdmin === adminEmail;
      });
      Logger.log("After admin filter: " + orders.length + " orders");
    }
    
    // Filter by order number if provided
    if (orderNumber) {
      orders = orders.filter(order => {
        const orderNum = order["Order Number"] || order["OrderNumber"] || "";
        return orderNum === orderNumber;
      });
      Logger.log("After order number filter: " + orders.length + " orders");
    }
    
    // Sort by timestamp/date (newest first)
    orders.sort((a, b) => {
      const dateA = new Date(a.Timestamp || a.Date || 0);
      const dateB = new Date(b.Timestamp || b.Date || 0);
      return dateB - dateA;
    });
    
    Logger.log("Returning " + orders.length + " orders");
    
    // Return the orders
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        count: orders.length,
        orders: orders,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error in doGet: " + error.toString());
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Can be used for more complex queries or actions
 */
function doPost(e) {
  try {
    Logger.log("=== POST REQUEST RECEIVED ===");
    Logger.log("Raw postData: " + e.postData.contents);
    
    const data = JSON.parse(e.postData.contents);
    Logger.log("Parsed data: " + JSON.stringify(data));
    
    // Handle different actions
    if (data.action === "getOrders") {
      // Similar to GET but allows POST for more complex queries
      const adminEmail = data.adminEmail || null;
      const orderNumber = data.orderNumber || null;
      
      // Use the same logic as doGet
      const sheet = getOrdersSheet();
      const sheetData = sheet.getDataRange().getValues();
      
      if (sheetData.length <= 1) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "success",
            count: 0,
            orders: []
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const headers = sheetData[0];
      const rows = sheetData.slice(1);
      
      let orders = rows.map(row => {
        let order = {};
        headers.forEach((header, index) => {
          order[header] = row[index] || "";
        });
        return order;
      });
      
      if (adminEmail) {
        orders = orders.filter(order => 
          (order["Admin Account"] || order["AdminAccount"] || "") === adminEmail
        );
      }
      
      if (orderNumber) {
        orders = orders.filter(order => 
          (order["Order Number"] || order["OrderNumber"] || "") === orderNumber
        );
      }
      
      orders.sort((a, b) => {
        const dateA = new Date(a.Timestamp || a.Date || 0);
        const dateB = new Date(b.Timestamp || b.Date || 0);
        return dateB - dateA;
      });
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          count: orders.length,
          orders: orders
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Unknown action
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Unknown action: " + (data.action || "none")
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
function testDisplayScript() {
  // Test getting all orders for a specific admin
  const e = {
    parameter: {
      adminEmail: "rjsbackpack@gmail.com"
    }
  };
  
  const result = doGet(e);
  Logger.log("Test result: " + result.getContent());
  
  // Also test that the spreadsheet exists
  try {
    const sheet = getOrdersSheet();
    Logger.log("Successfully found orders sheet");
    Logger.log("Spreadsheet URL: " + sheet.getParent().getUrl());
  } catch (error) {
    Logger.log("Error finding sheet: " + error.toString());
  }
}
