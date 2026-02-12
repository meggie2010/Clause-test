/**
 * Clarity Finance — Automated Report Pipeline
 *
 * This Apps Script automates the full reporting workflow:
 * 1. Upload a Rocket Money CSV → clears and replaces data in Google Sheets
 * 2. Looker Studio auto-updates (connected to this sheet)
 * 3. Export Looker Studio dashboard as PDF → saves to Google Drive
 *
 * SETUP:
 * 1. Open your Google Sheet (the one connected to Looker Studio)
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire file into the editor (replace any existing code)
 * 4. Click Save
 * 5. Run the "onOpen" function once to authorize (select it from the
 *    dropdown and click Run)
 * 6. Reload your spreadsheet — a "Clarity Finance" menu appears
 *
 * CONFIGURATION:
 * Update the CONFIG object below with your Looker Studio report ID
 * and the Google Drive folder ID where PDFs should be saved.
 */

// ============================================================
// CONFIGURATION — UPDATE THESE VALUES
// ============================================================

var CONFIG = {
  // Your Looker Studio report ID (from the URL)
  // Example URL: https://lookerstudio.google.com/reporting/15c331f6-72c5-436e-9f57-d609eeed8944
  // Report ID:   15c331f6-72c5-436e-9f57-d609eeed8944
  reportId: 'YOUR_REPORT_ID_HERE',

  // Google Drive folder ID where PDFs will be saved
  // Open the folder in Drive, copy the ID from the URL:
  // https://drive.google.com/drive/folders/FOLDER_ID_HERE
  // Leave empty to save to the root of your Drive
  driveFolderId: '',

  // Name of the sheet tab that holds the transaction data
  // This should match the sheet that Looker Studio is connected to
  dataSheetName: 'Sheet1',

  // Client name (used in PDF file naming)
  clientName: 'Client'
};

// ============================================================
// MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Clarity Finance')
    .addItem('1. Upload CSV & Replace Data', 'uploadCSV')
    .addItem('2. Export Dashboard PDF to Drive', 'exportPDF')
    .addSeparator()
    .addItem('Run Full Pipeline (CSV → PDF)', 'runFullPipeline')
    .addToUi();
}

// ============================================================
// STEP 1: CSV UPLOAD & DATA REPLACEMENT
// ============================================================

/**
 * Opens a file upload dialog for the Rocket Money CSV.
 */
function uploadCSV() {
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    '  body { font-family: Arial, sans-serif; padding: 20px; }' +
    '  h3 { color: #2b6777; margin-top: 0; }' +
    '  p { color: #555; font-size: 14px; }' +
    '  input[type="file"] { margin: 16px 0; display: block; }' +
    '  button { background: #2b6777; color: white; border: none; ' +
    '    padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }' +
    '  button:hover { background: #1a4a56; }' +
    '  button:disabled { background: #aaa; cursor: default; }' +
    '  #status { margin-top: 16px; font-size: 14px; color: #666; }' +
    '  .warn { color: #b45309; font-weight: bold; }' +
    '</style>' +
    '<h3>Upload Rocket Money CSV</h3>' +
    '<p>This will <span class="warn">clear all existing data</span> in the ' +
    'sheet and replace it with the CSV contents.</p>' +
    '<input type="file" id="csvFile" accept=".csv">' +
    '<button id="btn" onclick="uploadFile()">Upload & Replace Data</button>' +
    '<div id="status"></div>' +
    '<script>' +
    'function uploadFile() {' +
    '  var file = document.getElementById("csvFile").files[0];' +
    '  if (!file) { document.getElementById("status").innerText = "Please select a file."; return; }' +
    '  document.getElementById("btn").disabled = true;' +
    '  document.getElementById("status").innerText = "Importing... please wait.";' +
    '  var reader = new FileReader();' +
    '  reader.onload = function(e) {' +
    '    google.script.run' +
    '      .withSuccessHandler(function(msg) {' +
    '        document.getElementById("status").innerHTML = ' +
    '          "<b style=\\"color:green\\">" + msg + "</b>";' +
    '        document.getElementById("btn").disabled = false;' +
    '      })' +
    '      .withFailureHandler(function(err) {' +
    '        document.getElementById("status").innerHTML = ' +
    '          "<b style=\\"color:red\\">Error: " + err.message + "</b>";' +
    '        document.getElementById("btn").disabled = false;' +
    '      })' +
    '      .replaceSheetData(e.target.result);' +
    '  };' +
    '  reader.readAsText(file);' +
    '}' +
    '</script>'
  )
  .setWidth(450)
  .setHeight(280);

  SpreadsheetApp.getUi().showModalDialog(html, 'Upload CSV');
}

/**
 * Clears the data sheet and replaces it with parsed CSV data.
 * Keeps the same sheet so Looker Studio stays connected.
 */
function replaceSheetData(csvText) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.dataSheetName);

  if (!sheet) {
    throw new Error(
      'Sheet "' + CONFIG.dataSheetName + '" not found. ' +
      'Update CONFIG.dataSheetName in the script to match your sheet tab name.'
    );
  }

  var rows = parseCSV(csvText);
  if (rows.length < 2) {
    return 'No data found in CSV.';
  }

  // Clear all existing content
  sheet.clearContents();

  // Write all rows (header + data)
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  // Format header row
  sheet.getRange(1, 1, 1, rows[0].length)
    .setFontWeight('bold')
    .setBackground('#2b6777')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  // Auto-resize columns for readability
  for (var c = 1; c <= rows[0].length; c++) {
    sheet.autoResizeColumn(c);
  }

  var dataRows = rows.length - 1;
  return 'Success! Replaced data with ' + dataRows + ' rows (' + rows[0].length + ' columns).';
}

/**
 * Parses CSV text into a 2D array, handling quoted fields.
 */
function parseCSV(csvText) {
  var rows = [];
  var lines = csvText.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === '') continue;

    var row = [];
    var current = '';
    var inQuotes = false;

    for (var j = 0; j < line.length; j++) {
      var ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  // Ensure all rows have the same number of columns
  if (rows.length > 0) {
    var maxCols = rows[0].length;
    for (var r = 0; r < rows.length; r++) {
      while (rows[r].length < maxCols) {
        rows[r].push('');
      }
    }
  }

  return rows;
}

// ============================================================
// STEP 2: EXPORT LOOKER STUDIO PDF TO GOOGLE DRIVE
// ============================================================

/**
 * Exports the Looker Studio report as a PDF and saves it to Google Drive.
 */
function exportPDF() {
  var ui = SpreadsheetApp.getUi();

  if (CONFIG.reportId === 'YOUR_REPORT_ID_HERE') {
    ui.alert(
      'Configuration needed',
      'Please set your Looker Studio report ID in the CONFIG section of the script.\n\n' +
      'Go to Extensions > Apps Script and update CONFIG.reportId.',
      ui.ButtonSet.OK
    );
    return;
  }

  ui.alert(
    'Exporting PDF...',
    'The PDF export will begin. This may take a moment.\n\nClick OK to continue.',
    ui.ButtonSet.OK
  );

  try {
    var pdfBlob = fetchLookerStudioPDF();
    var file = savePDFToDrive(pdfBlob);

    ui.alert(
      'PDF Exported!',
      'Report saved to Google Drive:\n\n' +
      '📄 ' + file.getName() + '\n' +
      '📁 ' + (CONFIG.driveFolderId ? 'Configured folder' : 'My Drive root') + '\n\n' +
      'Link: ' + file.getUrl(),
      ui.ButtonSet.OK
    );
  } catch (e) {
    ui.alert(
      'Export Failed',
      'Could not export the PDF. Error:\n\n' + e.message + '\n\n' +
      'Make sure:\n' +
      '1. The report ID in CONFIG is correct\n' +
      '2. You have view access to the Looker Studio report\n' +
      '3. The report is not in edit mode',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Fetches the Looker Studio report as a PDF blob using the export URL.
 */
function fetchLookerStudioPDF() {
  var exportUrl = 'https://lookerstudio.google.com/reporting/' +
    CONFIG.reportId + '/export?format=pdf';

  var token = ScriptApp.getOAuthToken();

  var response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      'Authorization': 'Bearer ' + token
    },
    followRedirects: true,
    muteHttpExceptions: true
  });

  var responseCode = response.getResponseCode();
  if (responseCode !== 200) {
    throw new Error(
      'Looker Studio returned HTTP ' + responseCode + '. ' +
      'Check that the report ID is correct and you have access.'
    );
  }

  var blob = response.getBlob();
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var filename = 'Financial_Report_' + CONFIG.clientName.replace(/\s+/g, '_') + '_' + today + '.pdf';
  blob.setName(filename);

  return blob;
}

/**
 * Saves a PDF blob to the configured Google Drive folder.
 */
function savePDFToDrive(pdfBlob) {
  var folder;
  if (CONFIG.driveFolderId) {
    try {
      folder = DriveApp.getFolderById(CONFIG.driveFolderId);
    } catch (e) {
      throw new Error(
        'Could not access Drive folder with ID: ' + CONFIG.driveFolderId + '. ' +
        'Check that the folder exists and you have access.'
      );
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  var file = folder.createFile(pdfBlob);
  return file;
}

// ============================================================
// FULL PIPELINE: CSV → LOOKER STUDIO → PDF
// ============================================================

/**
 * Runs the full pipeline:
 * 1. Prompts for CSV upload and replaces sheet data
 * 2. Waits for Looker Studio to refresh (short delay)
 * 3. Exports the dashboard as PDF to Google Drive
 *
 * Note: The CSV upload is interactive (requires the dialog),
 * so this function opens the upload dialog first. After the
 * upload completes, call exportPDF() separately or use the
 * menu option.
 */
function runFullPipeline() {
  var ui = SpreadsheetApp.getUi();

  if (CONFIG.reportId === 'YOUR_REPORT_ID_HERE') {
    ui.alert(
      'Configuration needed',
      'Please set your Looker Studio report ID in the CONFIG section of the script.\n\n' +
      'Go to Extensions > Apps Script and update CONFIG.reportId.',
      ui.ButtonSet.OK
    );
    return;
  }

  // Show the full pipeline dialog
  var html = HtmlService.createHtmlOutput(
    '<style>' +
    '  body { font-family: Arial, sans-serif; padding: 20px; }' +
    '  h3 { color: #2b6777; margin-top: 0; }' +
    '  .step { padding: 12px; margin: 8px 0; border-radius: 6px; ' +
    '    background: #f9fafb; border-left: 4px solid #ddd; }' +
    '  .step.active { border-left-color: #f2a154; background: #fdf8f3; }' +
    '  .step.done { border-left-color: #22c55e; background: #f0fdf4; }' +
    '  .step-num { font-weight: bold; color: #2b6777; }' +
    '  input[type="file"] { margin: 12px 0; display: block; }' +
    '  button { background: #2b6777; color: white; border: none; ' +
    '    padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 14px; }' +
    '  button:hover { background: #1a4a56; }' +
    '  button:disabled { background: #aaa; cursor: default; }' +
    '  #status { margin-top: 12px; font-size: 14px; }' +
    '</style>' +
    '<h3>Full Report Pipeline</h3>' +
    '<div id="step1" class="step active">' +
    '  <span class="step-num">Step 1:</span> Upload CSV & replace data' +
    '</div>' +
    '<div id="step2" class="step">' +
    '  <span class="step-num">Step 2:</span> Wait for Looker Studio refresh' +
    '</div>' +
    '<div id="step3" class="step">' +
    '  <span class="step-num">Step 3:</span> Export PDF to Google Drive' +
    '</div>' +
    '<br>' +
    '<input type="file" id="csvFile" accept=".csv">' +
    '<button id="btn" onclick="startPipeline()">Start Pipeline</button>' +
    '<div id="status"></div>' +
    '<script>' +
    'function setStep(num, state) {' +
    '  document.getElementById("step" + num).className = "step " + state;' +
    '}' +
    'function setStatus(msg, color) {' +
    '  document.getElementById("status").innerHTML = ' +
    '    "<span style=\\"color:" + (color||"#666") + "\\">" + msg + "</span>";' +
    '}' +
    '' +
    'function startPipeline() {' +
    '  var file = document.getElementById("csvFile").files[0];' +
    '  if (!file) { setStatus("Please select a CSV file.", "red"); return; }' +
    '  document.getElementById("btn").disabled = true;' +
    '' +
    '  // Step 1: Upload CSV' +
    '  setStatus("Step 1: Uploading CSV and replacing data...");' +
    '  var reader = new FileReader();' +
    '  reader.onload = function(e) {' +
    '    google.script.run' +
    '      .withSuccessHandler(function(msg) {' +
    '        setStep(1, "done");' +
    '        setStep(2, "active");' +
    '        setStatus("Step 1 done: " + msg + " — Waiting 15s for Looker Studio to refresh...");' +
    '' +
    '        // Step 2: Wait for Looker Studio to pick up the new data' +
    '        setTimeout(function() {' +
    '          setStep(2, "done");' +
    '          setStep(3, "active");' +
    '          setStatus("Step 3: Exporting PDF to Google Drive...");' +
    '' +
    '          // Step 3: Export PDF' +
    '          google.script.run' +
    '            .withSuccessHandler(function(result) {' +
    '              setStep(3, "done");' +
    '              setStatus("All done! PDF saved: " + result, "green");' +
    '              document.getElementById("btn").disabled = false;' +
    '            })' +
    '            .withFailureHandler(function(err) {' +
    '              setStatus("PDF export failed: " + err.message + ' +
    '                "<br>Data was imported successfully. Try exporting PDF separately.", "red");' +
    '              document.getElementById("btn").disabled = false;' +
    '            })' +
    '            .exportPDFAndReturnInfo();' +
    '        }, 15000);' +
    '      })' +
    '      .withFailureHandler(function(err) {' +
    '        setStatus("CSV import failed: " + err.message, "red");' +
    '        document.getElementById("btn").disabled = false;' +
    '      })' +
    '      .replaceSheetData(e.target.result);' +
    '  };' +
    '  reader.readAsText(file);' +
    '}' +
    '</script>'
  )
  .setWidth(500)
  .setHeight(420);

  ui.showModalDialog(html, 'Report Pipeline');
}

/**
 * Exports PDF and returns a string with file info (used by the pipeline dialog).
 */
function exportPDFAndReturnInfo() {
  var pdfBlob = fetchLookerStudioPDF();
  var file = savePDFToDrive(pdfBlob);
  return file.getName() + ' — ' + file.getUrl();
}
