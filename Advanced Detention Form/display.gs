/**
 * Google Apps Script for Detention Display Page
 * This script fetches data from all school year sheets and returns it
 * to the display.html page for folder-based navigation.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Click the "+" next to "Files" to add a new script file
 * 4. Name it "display" (it will become display.gs)
 * 5. Paste this code into the new file
 * 6. Click "Deploy" > "New deployment" (or manage existing deployment)
 * 7. Choose "Web app" as deployment type
 * 8. Set "Execute as" to "Me"
 * 9. Set "Who has access" to "Anyone"
 * 10. Click "Deploy" and copy the web app URL
 * 11. Replace the sheetURL in display.html with this new URL
 * 
 * NOTE: You can have both scripts in the same Apps Script project.
 * The doGet function here handles GET requests (for display)
 * The doPost function in form.gs handles POST requests (for submissions)
 */

// Handle GET requests from display page
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();
    
    // Collect all data from all school year sheets
    let allData = [];
    let headers = [];
    
    // Standard headers (Timestamp removed)
    headers = [
      'Teacher Email',
      'Teacher Name',
      'Student Name',
      'Student ID',
      'Grade',
      'Main Type',
      'Sub Type',
      'Period',
      'Location',
      'Incident Date',
      'School Year'  // Add school year to help with filtering
    ];
    
    allData.push(headers);
    
    // Process each sheet that looks like a school year (XX-XX format)
    for (let i = 0; i < allSheets.length; i++) {
      const sheet = allSheets[i];
      const sheetName = sheet.getName();
      
      // Check if sheet name matches school year pattern (e.g., "25-26", "26-27")
      if (/^\d{2}-\d{2}$/.test(sheetName)) {
        const lastRow = sheet.getLastRow();
        
        // Skip if sheet only has headers or is empty
        if (lastRow <= 1) {
          continue;
        }
        
        // Get all data from this sheet (excluding header row)
        const numCols = sheet.getLastColumn();
        const sheetData = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
        
        // Add school year to each row and append to allData
        for (let j = 0; j < sheetData.length; j++) {
          const row = sheetData[j];
          
          // Check if first column looks like a timestamp, if so remove it
          let processedRow;
          if (row.length > 0 && (row[0] instanceof Date || typeof row[0] === 'string')) {
            // Check if this looks like old format with Timestamp column
            // If row has 11 columns (with Timestamp), slice from 1
            // If row has 10 columns (without Timestamp), use as is
            if (numCols >= 11) {
              processedRow = row.slice(1);
            } else {
              processedRow = row.slice(0);
            }
          } else {
            processedRow = row.slice(0);
          }
          
          // Ensure row has all columns, pad with empty strings if needed
          while (processedRow.length < 10) {
            processedRow.push('');
          }
          
          // Add school year as last column
          processedRow.push(sheetName);
          
          allData.push(processedRow);
        }
      }
    }
    
    // Sort data by Incident Date (index 9), then Period (index 7), then Student Name (index 2)
    // Skip header row (index 0)
    const headerRow = allData[0];
    const dataRows = allData.slice(1);
    
    dataRows.sort((a, b) => {
      // Sort by Incident Date (index 9)
      const dateA = new Date(a[9]);
      const dateB = new Date(b[9]);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      // If dates are same, sort by Period (index 7) - convert to number
      const periodA = parseInt(a[7]) || 0;
      const periodB = parseInt(b[7]) || 0;
      
      if (periodA !== periodB) {
        return periodA - periodB;
      }
      
      // If periods are same, sort by Student Name (index 2)
      const nameA = String(a[2] || '').toLowerCase();
      const nameB = String(b[2] || '').toLowerCase();
      
      return nameA.localeCompare(nameB);
    });
    
    // Recombine header and sorted data
    allData = [headerRow].concat(dataRows);
    
    // Return data as JSON
    return ContentService.createTextOutput(JSON.stringify(allData))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    
    // Return error as JSON
    return ContentService.createTextOutput(JSON.stringify({
      'error': error.toString(),
      'message': 'Failed to fetch data'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Alternative function to get data for a specific school year and grade
function getDataBySchoolYearAndGrade(schoolYear, grade) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(schoolYear);
    
    if (!sheet) {
      return {
        'error': 'School year sheet not found',
        'schoolYear': schoolYear
      };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        'headers': sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0],
        'data': []
      };
    }
    
    // Get all data
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const allData = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    
    // Find grade column index
    const gradeColumnIndex = headers.indexOf('Grade');
    
    // Filter by grade if specified
    let filteredData = allData;
    if (grade && gradeColumnIndex !== -1) {
      filteredData = allData.filter(row => row[gradeColumnIndex] === grade);
    }
    
    return {
      'headers': headers,
      'data': filteredData,
      'schoolYear': schoolYear,
      'grade': grade || 'All'
    };
    
  } catch (error) {
    Logger.log('Error in getDataBySchoolYearAndGrade: ' + error.toString());
    return {
      'error': error.toString()
    };
  }
}

// Get list of all school year sheets
function getAllSchoolYears() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();
    const schoolYears = [];
    
    for (let i = 0; i < allSheets.length; i++) {
      const sheetName = allSheets[i].getName();
      
      // Check if sheet name matches school year pattern
      if (/^\d{2}-\d{2}$/.test(sheetName)) {
        schoolYears.push(sheetName);
      }
    }
    
    // Sort school years (most recent first)
    schoolYears.sort((a, b) => {
      const aStart = parseInt(a.split('-')[0]);
      const bStart = parseInt(b.split('-')[0]);
      return bStart - aStart;
    });
    
    return schoolYears;
    
  } catch (error) {
    Logger.log('Error in getAllSchoolYears: ' + error.toString());
    return [];
  }
}

// Get statistics for dashboard
function getStatistics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const allSheets = ss.getSheets();
    
    const stats = {
      totalRecords: 0,
      bySchoolYear: {},
      byGrade: {
        'Freshman': 0,
        'Sophomore': 0,
        'Junior': 0,
        'Senior': 0
      },
      byMainType: {}
    };
    
    // Process each school year sheet
    for (let i = 0; i < allSheets.length; i++) {
      const sheet = allSheets[i];
      const sheetName = sheet.getName();
      
      if (/^\d{2}-\d{2}$/.test(sheetName)) {
        const lastRow = sheet.getLastRow();
        
        if (lastRow <= 1) {
          stats.bySchoolYear[sheetName] = 0;
          continue;
        }
        
        const recordCount = lastRow - 1;
        stats.totalRecords += recordCount;
        stats.bySchoolYear[sheetName] = recordCount;
        
        // Get grade and main type data
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const gradeIndex = headers.indexOf('Grade');
        const mainTypeIndex = headers.indexOf('Main Type');
        
        if (gradeIndex !== -1 || mainTypeIndex !== -1) {
          const data = sheet.getRange(2, 1, recordCount, sheet.getLastColumn()).getValues();
          
          for (let j = 0; j < data.length; j++) {
            // Count by grade
            if (gradeIndex !== -1) {
              const grade = data[j][gradeIndex];
              if (grade && stats.byGrade[grade] !== undefined) {
                stats.byGrade[grade]++;
              }
            }
            
            // Count by main type
            if (mainTypeIndex !== -1) {
              const mainType = data[j][mainTypeIndex];
              if (mainType) {
                if (!stats.byMainType[mainType]) {
                  stats.byMainType[mainType] = 0;
                }
                stats.byMainType[mainType]++;
              }
            }
          }
        }
      }
    }
    
    return stats;
    
  } catch (error) {
    Logger.log('Error in getStatistics: ' + error.toString());
    return {
      'error': error.toString()
    };
  }
}

// Test function to verify data retrieval
function testDataRetrieval() {
  const data = doGet({});
  const content = data.getContent();
  const parsed = JSON.parse(content);
  
  Logger.log('Total rows (including header): ' + parsed.length);
  Logger.log('Headers: ' + JSON.stringify(parsed[0]));
  
  if (parsed.length > 1) {
    Logger.log('First record: ' + JSON.stringify(parsed[1]));
  }
}

// Test function to get statistics
function testStatistics() {
  const stats = getStatistics();
  Logger.log('Statistics: ' + JSON.stringify(stats, null, 2));
}

// Test function to list all school years
function testSchoolYears() {
  const years = getAllSchoolYears();
  Logger.log('School Years: ' + JSON.stringify(years));
}
