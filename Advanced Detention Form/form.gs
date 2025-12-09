/**
 * Google Apps Script for Detention Form Submission
 * This script handles form submissions and organizes data into school year sheets
 * with separate sections for Freshman, Sophomore, Junior, and Senior grades.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire script
 * 4. Click "Deploy" > "New deployment"
 * 5. Choose "Web app" as deployment type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click "Deploy" and copy the web app URL
 * 9. Replace the URL in index.html with this new URL
 */

// Get current school year based on date (Aug 25 - Jun 27)
function getCurrentSchoolYear(dateOverride) {
  const now = dateOverride ? new Date(dateOverride) : new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();
  
  // School year starts Aug 25 and ends Jun 27
  if (month >= 8 || (month <= 6 && day <= 27)) {
    if (month >= 8) {
      return year.toString().slice(-2) + '-' + (year + 1).toString().slice(-2);
    } else {
      return (year - 1).toString().slice(-2) + '-' + year.toString().slice(-2);
    }
  } else {
    return year.toString().slice(-2) + '-' + (year + 1).toString().slice(-2);
  }
}

// Check if school year is locked (past Jun 27 of ending year)
function isSchoolYearLocked(schoolYear, dateOverride) {
  const endYear = parseInt('20' + schoolYear.split('-')[1]);
  const lockDate = new Date(endYear, 5, 27); // June 27 (month is 0-indexed)
  const now = dateOverride ? new Date(dateOverride) : new Date();
  return now > lockDate;
}

// Get or create sheet for school year
function getOrCreateSchoolYearSheet(schoolYear) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(schoolYear);
  
  if (!sheet) {
    // Create new sheet for this school year
    sheet = ss.insertSheet(schoolYear);
    
    // Set up headers with Grade column (Timestamp removed)
    const headers = [
      'Teacher Email',
      'Teacher Name',
      'Student Name',
      'Student ID',
      'Grade',
      'Main Type',
      'Sub Type',
      'Period',
      'Location',
      'Incident Date'
    ];
    
    // Add headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#2c5364');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    headerRange.setFontSize(15);
    headerRange.setFontFamily('Dancing Script');
    
    // Set row height for header (not too tall)
    sheet.setRowHeight(1, 25);
    
    // Set column widths based on content size (wider than before)
    const columnWidths = {
      1: 220,  // Teacher Email
      2: 160,  // Teacher Name
      3: 160,  // Student Name
      4: 110,  // Student ID
      5: 110,  // Grade
      6: 140,  // Main Type
      7: 160,  // Sub Type
      8: 90,   // Period
      9: 140,  // Location
      10: 150  // Incident Date
    };
    
    for (let i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, columnWidths[i]);
    }
    
    // Freeze header row
    sheet.setFrozenRows(1);
    
    Logger.log('Created new sheet: ' + schoolYear);
  }
  
  return sheet;
}

// Main function to handle form submission
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Check if there's a simulated date from the form
    const simulatedDate = data.simulatedDate || null;
    
    // Get current school year (using simulated date if provided)
    const schoolYear = getCurrentSchoolYear(simulatedDate);
    
    // Check if school year is locked (using simulated date if provided)
    if (isSchoolYearLocked(schoolYear, simulatedDate)) {
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'message': 'Current school year is locked. Cannot add new records after June 27th.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get or create the sheet for this school year
    const sheet = getOrCreateSchoolYearSheet(schoolYear);
    
    // Prepare row data (Timestamp removed)
    const rowData = [
      data.teacherEmail || '',
      data.teacherName || '',
      data.studentName || '',
      data.studentId || '',
      data.grade || '', // Grade (Freshman, Sophomore, Junior, Senior)
      data.mainType || '',
      data.subType || '',
      data.period || '',
      data.location || '',
      data.incidentDate || ''
    ];
    
    // Append the data
    const newRowNumber = sheet.getLastRow() + 1;
    sheet.appendRow(rowData);
    
    // Format the new data row (normal font, not Dancing Script)
    const newRowRange = sheet.getRange(newRowNumber, 1, 1, sheet.getLastColumn());
    newRowRange.setFontFamily('Arial'); // Normal font for data
    newRowRange.setFontSize(10); // Standard size for readability
    
    // Sort the sheet by Incident Date (column 10), then Period (column 8), then Student Name (column 3)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
      dataRange.sort([
        {column: 10, ascending: true},  // Sort by Incident Date
        {column: 8, ascending: true},   // Then by Period (lowest to highest)
        {column: 3, ascending: true}    // Then by Student Name (alphabetically)
      ]);
      
      // After sorting, re-apply normal font to all data rows
      dataRange.setFontFamily('Arial');
      dataRange.setFontSize(10);
    }
    
    // Apply alternating row colors for better readability
    formatSheetByGrade(sheet);
    
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Data saved successfully',
      'schoolYear': schoolYear
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Format sheet with visual separation by grade
function formatSheetByGrade(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;
  
  const gradeColumn = 5; // Grade column (was 6, now 5 after removing Timestamp)
  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const gradeValues = sheet.getRange(2, gradeColumn, lastRow - 1, 1).getValues();
  
  // Define colors for each grade
  const gradeColors = {
    'Freshman': '#e3f2fd',   // Light blue
    'Sophomore': '#f3e5f5',  // Light purple
    'Junior': '#fff3e0',     // Light orange
    'Senior': '#e8f5e9'      // Light green
  };
  
  // Apply colors row by row
  for (let i = 0; i < gradeValues.length; i++) {
    const grade = gradeValues[i][0];
    const rowRange = sheet.getRange(i + 2, 1, 1, sheet.getLastColumn());
    
    if (gradeColors[grade]) {
      rowRange.setBackground(gradeColors[grade]);
    } else {
      rowRange.setBackground('#ffffff'); // White for unknown grades
    }
    
    // Ensure data rows keep normal font
    rowRange.setFontFamily('Arial');
    rowRange.setFontSize(10);
  }
  
  // Re-apply header formatting to ensure it stays with Dancing Script
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#2c5364');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Dancing Script');
  headerRange.setFontSize(15);
}

// Create initial sheets for testing (run this manually once)
function setupInitialSheets() {
  const currentYear = getCurrentSchoolYear();
  getOrCreateSchoolYearSheet(currentYear);
  Logger.log('Setup complete. Created sheet: ' + currentYear);
}

// Test function to verify school year calculation
function testSchoolYearCalculation() {
  const currentYear = getCurrentSchoolYear();
  Logger.log('Current School Year: ' + currentYear);
  Logger.log('Is Locked: ' + isSchoolYearLocked(currentYear));
  
  // Test with simulated dates
  Logger.log('\nTest Simulated Dates:');
  Logger.log('Aug 20, 2025: ' + getCurrentSchoolYear('2025-08-20'));
  Logger.log('Sep 15, 2025: ' + getCurrentSchoolYear('2025-09-15'));
  Logger.log('Jun 28, 2026: ' + getCurrentSchoolYear('2026-06-28') + ' (Locked: ' + isSchoolYearLocked(getCurrentSchoolYear('2026-06-28'), '2026-06-28') + ')');
  Logger.log('Aug 26, 2026: ' + getCurrentSchoolYear('2026-08-26'));
}
