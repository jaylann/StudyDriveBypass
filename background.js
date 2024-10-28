// Initialize IndexedDB
const DB_NAME = "PDFStore";
const DB_VERSION = 1;
const STORE_NAME = "pdfs";

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

// Add a PDF Blob to the store
async function addPDF(pdfBlob, url) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const record = {
            blob: pdfBlob,
            url: url,
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

// Object to keep track of PDF requests
const pdfRequests = {};

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

                    // Retrieve the original URL or other details
                    const originalUrl = details.url;

                    // Store the PDF Blob in IndexedDB
                    await addPDF(blob, originalUrl);
                    console.log(`Stored PDF from: ${originalUrl}`);
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
        const pdfs = await getAllPDFs();

        if (pdfs.length === 0) {
            return;
        }

        for (const pdf of pdfs) {
            const url = URL.createObjectURL(pdf.blob);
            const filename = `downloaded_${new Date(pdf.timestamp).toISOString().replace(/[:.]/g, "_")}.pdf`;

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
