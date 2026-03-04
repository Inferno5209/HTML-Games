
/**
 * ADMIN BACKEND
 * Handles all logic related to managing administrators.
 * Schema: Name | Email | Password | Role | Date Added | Status
 */

var AdminBackend = {
  
  // Sheet Configuration
  SPREADSHEET_ID: "1uNvHz_xEDkA_A43kPQz08-vRdmx7oFhZkkwNwI29mb8", 
  SHEET_NAME: "Admins",

  handleRequest: function(params) {
    const action = params.action;
    
    if (action === 'login') {
        return this.login(params.email, params.password);
    }
    else if (action === 'addAdmin') {
      return this.addAdmin(params.name, params.email, params.password);
    } 
    else if (action === 'removeAdmin') {
      return this.removeAdmin(params.email, params.requesterEmail);
    } 
    else if (action === 'getAdmins') {
      return this.getAdmins(params.requesterEmail);
    }
    else if (action === 'transferOwnership') {
        return this.transferOwnership(params.currentOwnerEmail, params.newOwnerEmail);
    }
    else if (action === 'logout') {
        return this.logout(params.email);
    }
  },

  logout: function(email) {
      if (!email) return createOutput("Error", "No email provided");
      
      // Clear Cache
      CacheService.getScriptCache().remove('online_' + email);

      const sheet = this.getAdminSheet();
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
          if (data[i][1] === email) {
              // Mark Offline using Col 6 (Status)
              sheet.getRange(i + 1, 6).setValue("Offline"); 
              return createOutput("Success", "Logged out");
          }
      }
      return createOutput("Success", "User not found (session cleared)");
  },

  login: function(email, password) {
    const sheet = this.getAdminSheet();
    const data = sheet.getDataRange().getValues();
    
    const inputEmail = email.toString().trim().toLowerCase();
    const inputPass = password.toString().trim();

    for (let i = 1; i < data.length; i++) {
        const sheetEmail = (data[i][1] || "").toString().trim().toLowerCase();
        const sheetPass = (data[i][2] || "").toString().trim();

        if (sheetEmail === inputEmail && sheetPass === inputPass) {
            let role = data[i][3] || "Admin"; 
            
            if (data.length === 2 && role !== "Owner") {
                role = "Owner";
                sheet.getRange(i + 1, 4).setValue("Owner");
            }

            // Update Heartbeat (Cache + Sheet)
            const realEmail = data[i][1];
            CacheService.getScriptCache().put('online_' + realEmail, 'true', 300); // 5 mins
            sheet.getRange(i + 1, 6).setValue("Online");
            
            return createOutput("Success", { 
                name: data[i][0], 
                email: realEmail, 
                role: role 
            });
        }
    }
    return createOutput("Error", "Wrong email or password.");
  },

  getAdmins: function(requesterEmail) {
    const sheet = this.getAdminSheet();
    const data = sheet.getDataRange().getValues();
    const cache = CacheService.getScriptCache();
    
    // 1. Update Requester Heartbeat
    if (requesterEmail) {
        cache.put('online_' + requesterEmail, 'true', 300);
        // We will update the sheet loop below
    }

    // 2. Resolve Requester Role
    let requesterRole = "Admin";
    for (let i = 1; i < data.length; i++) {
        if (data[i][1] === requesterEmail) {
            requesterRole = data[i][3];
            break;
        }
    }

    const admins = [];
    let ownerExists = false;
    const statusUpdates = [];

    for (let i = 1; i < data.length; i++) {
        // Owner Check
        if (data[i][3] === "Owner") ownerExists = true;

        const email = data[i][1];
        let currentStatus = data[i][5]; // Col 6 is index 5
        
        // Check Cache for Truth
        const isCached = cache.get('online_' + email);
        let newStatus = isCached ? "Online" : "Offline";
        
        // Sync Sheet if mismatch
        if (currentStatus !== newStatus) {
             statusUpdates.push({row: i + 1, val: newStatus});
             currentStatus = newStatus;
        }
        
        // Security Masking
        let password = data[i][2];
        if (requesterRole !== "Owner" && email !== requesterEmail) {
            password = "••••••••";
        }

        admins.push({
            name: data[i][0],
            email: email,
            password: password,
            role: data[i][3],
            status: currentStatus
        });
    }

    // Write Updates
    statusUpdates.forEach(u => {
        sheet.getRange(u.row, 6).setValue(u.val);
    });

    // Self-heal Owner
    if (!ownerExists && data.length > 1) {
        sheet.getRange(2, 4).setValue("Owner");
    }

    return createOutput("Success", admins);
  },

  addAdmin: function(name, email, password) {
    if (!email || !password || !name) return createOutput("Error", "Missing fields");
    const sheet = this.getAdminSheet();
    // Default: Admin, Added Now, Status Offline
    sheet.appendRow([name, email, password, "Admin", new Date(), "Offline"]);
    return createOutput("Success", `Admin ${name} added successfully.`);
  },

  removeAdmin: function(email, requesterEmail) {
    const sheet = this.getAdminSheet();
    const data = sheet.getDataRange().getValues();
    let targetRow = -1;
    let targetRole = "";

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        targetRow = i + 1;
        targetRole = data[i][3];
        break;
      }
    }

    if (targetRow === -1) return createOutput("Error", "Admin not found.");
    if (targetRole === "Owner") return createOutput("Error", "The Owner cannot be removed.");

    sheet.deleteRow(targetRow);
    return createOutput("Success", `Admin ${email} removed.`);
  },

  transferOwnership: function(currentOwnerEmail, newOwnerEmail) {
      const sheet = this.getAdminSheet();
      const data = sheet.getDataRange().getValues();
      let currentOwnerRow = -1;
      let newOwnerRow = -1;

      for (let i = 1; i < data.length; i++) {
          if (data[i][1] === currentOwnerEmail) currentOwnerRow = i + 1;
          if (data[i][1] === newOwnerEmail) newOwnerRow = i + 1;
      }

      if (currentOwnerRow === -1 || newOwnerRow === -1) return createOutput("Error", "User not found.");
      const actualRole = sheet.getRange(currentOwnerRow, 4).getValue();
      if (actualRole !== "Owner") return createOutput("Error", "Requester is not the Owner.");

      sheet.getRange(currentOwnerRow, 4).setValue("Admin");
      sheet.getRange(newOwnerRow, 4).setValue("Owner");
      return createOutput("Success", "Ownership transferred.");
  },

  getAdminSheet: function() {
    let ss;
    try {
      if (this.SPREADSHEET_ID) ss = SpreadsheetApp.openById(this.SPREADSHEET_ID);
      else ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(e) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    let sheet = ss.getSheetByName(this.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(this.SHEET_NAME);
      // Removed Last Seen, Status is Col 6
      sheet.appendRow(["Name", "Email", "Password", "Role", "Date Added", "Status"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    } else {
        // Schema Migration (Lazy)
        // If header Col 6 is "Last Seen", overwrite it?
        // Let's just trust the user will wipe or we'll naturally overwrite.
        const header = sheet.getRange(1, 6).getValue();
        if (header === "Last Seen") {
            // Migration: Rename to Status and clear column
            sheet.getRange(1, 6).setValue("Status");
            sheet.getRange(2, 6, sheet.getLastRow(), 1).clearContent();
            // Also clear Col 7 if it exists
            if (sheet.getLastColumn() >= 7) {
                sheet.getRange(1, 7, sheet.getLastRow(), 1).clearContent();
            }
        }
    }
    return sheet;
  }
};
