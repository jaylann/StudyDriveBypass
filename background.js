// Initialize IndexedDB
const DB_NAME = "PDFStore";
const DB_VERSION = 1;
const STORE_NAME = "pdfs";

// Track ongoing PDF storage operations
const storagePromises = new Set();

// Open or create the IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };

        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Add a PDF Blob to the store, including the title
async function addPDF(pdfBlob, url, title) {
    const db = await openDatabase();
    const promise = new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const record = {
            blob: pdfBlob,
            url: url,
            title: title, // Store the tab title
            timestamp: Date.now()
        };
        const request = store.add(record);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = event => {
            reject(event.target.error);
        };
    });

    // Add the storage promise to the Set
    storagePromises.add(promise);
    // Remove the promise from the Set once it's settled
    promise.finally(() => storagePromises.delete(promise));

    return promise;
}

// Retrieve all PDFs from the store
async function getAllPDFs() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = event => {
            resolve(event.target.result);
        };

        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Clear all PDFs from the store
async function clearPDFs() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = event => {
            reject(event.target.error);
        };
    });
}

// Function to sanitize filename
function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_');
}

// Listen for headers to identify PDF responses
browser.webRequest.onHeadersReceived.addListener(
    function(details) {
        const requestId = details.requestId;
        const responseHeaders = details.responseHeaders;

        let isPdf = false;

        for (const header of responseHeaders) {
            if (header.name.toLowerCase() === "content-type") {
                if (header.value.toLowerCase().startsWith("application/pdf")) {
                    isPdf = true;
                    break;
                }
            }
        }

        if (isPdf) {
            const filter = browser.webRequest.filterResponseData(requestId);
            const data = [];

            filter.ondata = event => {
                data.push(event.data);
                filter.write(event.data);
            };

            filter.onstop = async () => {
                filter.disconnect();

                try {
                    // Combine the data into a Blob
                    const blob = new Blob(data, { type: "application/pdf" });

                    // Retrieve the original URL
                    const originalUrl = details.url;

                    // Get the tab title
                    let title = 'untitled';
                    if (details.tabId !== -1) {
                        try {
                            const tab = await browser.tabs.get(details.tabId);
                            title = tab.title || 'untitled';
                            title = title.replace(".pdf", ""); // Remove .pdf from title
                            title = title.replace(" - Download", ""); // Remove - Download from title
                        } catch (tabError) {
                            console.error("Error getting tab info:", tabError);
                        }
                    }

                    // Sanitize the title to be a valid filename
                    const sanitizedTitle = sanitizeFilename(title);

                    // Store the PDF Blob in IndexedDB with the title
                    await addPDF(blob, originalUrl, sanitizedTitle);
                    console.log(`Stored PDF from: ${originalUrl} with title: ${sanitizedTitle}`);
                } catch (err) {
                    console.error("Error storing PDF:", err);
                }
            };

            return {};
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking", "responseHeaders"]
);

// Listen for extension button clicks to download stored PDFs
browser.browserAction.onClicked.addListener(async () => {
    try {
        // Wait for all ongoing storage operations to complete
        if (storagePromises.size > 0) {
            console.log("Waiting for ongoing PDF storage operations to complete...");
            await Promise.all([...storagePromises]);
            console.log("All PDF storage operations completed.");
        }

        const pdfs = await getAllPDFs();

        if (pdfs.length === 0) {
            console.log("No PDFs to download.");
            return;
        }

        for (const pdf of pdfs) {
            const url = URL.createObjectURL(pdf.blob);
            const filename = `${pdf.title}.pdf`; // Use the sanitized title

            try {
                await browser.downloads.download({
                    url: url,
                    filename: filename,
                    saveAs: false
                });
                console.log(`Downloaded PDF: ${filename}`);
            } catch (downloadErr) {
                console.error("Download failed:", downloadErr);
            }

            // Revoke the object URL after download
            URL.revokeObjectURL(url);
        }

        // Clear stored PDFs after downloading
        await clearPDFs();
        console.log("Cleared stored PDFs.");
    } catch (err) {
        console.error("Error during download process:", err);
    }
});
