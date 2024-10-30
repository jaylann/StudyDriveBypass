# StudyDrive Bypasser

## Overview

**StudyDrive Bypasser** is a Firefox extension designed to PDF documents from StudyDrive. This tool simplifies the process of downloading PDFs without any restrictions, provided you are logged into your StudyDrive account. No premium subscription is required.

Doesnt work on Chrome because google decided to deprecate Manifest V2 	ヽ༼ຈʖ̯ຈ༽ﾉ.

---

## Prerequisites

- **Browser:** Mozilla Firefox. 
- **Account:** Active StudyDrive account (must be logged in for the extension to function correctly).

---

## Installation

### Step 1: Download the Extension Files

**Clone the Repository:**

   ```bash
   git clone https://github.com/jaylann/StudyDriveBypass
   ```

### Step 2: Load the Extension in Firefox

1. **Open Firefox.**

2. **Access the Add-ons Debugging Page:**

   Type `about:debugging#/runtime/this-firefox` in the address bar and press Enter.

3. **Load Temporary Add-on:**

    - Click on the **"Load Temporary Add-on"** button.
    - In the file dialog, navigate to the project directory.
    - Select the `manifest.json` file.

   **Note:** This method loads the extension temporarily. To use the extension permanently, you need to package and sign it through Mozilla's [Add-ons Developer Hub](https://addons.mozilla.org/developers/).

---

## Usage

### Step 1: Sign In to StudyDrive

Ensure you are logged into your StudyDrive account in Firefox. Otherwise, the extension will not be able to access the PDF documents.

### Step 2: Activate the Extension


1. Browse the StudyDrive website as you normally would.

2. Choose any file you would like to download.

3. Wait for the document page to load fully.

4. Click on the extension icon in the Firefox toolbar to initiate the download process.


### Step 3: Access Your Downloads

All downloaded PDFs will be saved to your browser's default download directory. Each file will be named based on the sanitized title from the corresponding StudyDrive page.

## Troubleshooting

- **Extension Not Detecting PDFs:**
    - Refresh the StudyDrive page and try again.
    - Make sure to click the extension icon after the document page has fully loaded (No spinning icon).
    - Ensure you are logged into StudyDrive.
    - Verify that the extension is properly loaded in Firefox.
    - Check the browser console for any error messages.

- **Downloads Failing:**
    - Ensure Firefox has permission to download files.
    - Check available disk space.
    - Verify that the download directory is accessible.

- **Extension Not Appearing:**
    - Make sure the extension is loaded as a temporary add-on.
    - Restart Firefox and try reloading the extension.

---

## Disclaimer

**StudyDrive Bypasser** is intended for educational purposes only. Ensure that your use of this extension complies with StudyDrive's [Terms of Service](https://www.studydrive.net/terms) and all applicable laws. The author is not responsible for any misuse of this tool.

