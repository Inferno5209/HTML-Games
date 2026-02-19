
/**
 * MAIN ENTRY POINT
 * Routes incoming HTTP requests to the appropriate service.
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    let params = {};

    // 1. Try to parse JSON body (fetch API)
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        return createOutput("Error", "Invalid JSON body");
      }
    } 
    // 2. Fallback to URL parameters (HTML Forms)
    else if (e.parameter) {
      params = e.parameter;
    }

    if (!params || !params.action) {
      return createOutput("Error", "No action specified");
    }

    const action = params.action;

    // 3. Route to Admin Backend
    if (['addAdmin', 'removeAdmin', 'getAdmins', 'login', 'transferOwnership', 'logout'].includes(action)) {
      return AdminBackend.handleRequest(params);
    }

    // 4. Route to CMS Backend
    if (['getContent', 'updateContent', 'updateContentBatch', 'setup'].includes(action)) {
      return CmsBackend.handleRequest(params);
    }

    return createOutput("Error", "Invalid action: " + action);

  } catch (error) {
    return createOutput("Error", error.toString());
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return createOutput("Success", "Crystal Acres Backend is Running");
}

/**
 * Shared Helper to create JSON Output
 * Uses the built-in ContentService class.
 */
function createOutput(status, message) {
  if (status === "Success" || status === "success") {
    status = "success"; // Normalize to lowercase for frontend consistency
  } else {
    status = "error";
  }

  const output = {
    status: status,
    [status === "success" ? "data" : "message"]: message
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}
