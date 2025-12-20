const UsagePage = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 dark:py-28 text-gray-800 dark:text-neutral-200">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        Usage Guide
      </h1>
      <div className="w-full h-0.5 bg-blue-500 mx-auto mt-2 mb-6 rounded" />

      <p className="mb-4">
        <strong>QuickDrop</strong> is a lightweight, instant file sharing tool
        built for convenience and speed. You can use it to upload a file and
        share it via a short key or QR code.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">How to Upload</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Go to the Upload page via the navigation bar or the home page.</li>
        <li>
          Drag and drop your file or use the <strong>Choose File</strong>{" "}
          button.
        </li>
        <li>
          You can select <strong>multiple files</strong> at once.
        </li>
        <li>
          Click <strong>Upload</strong>. You'll receive a unique code and QR
          code.
        </li>
        <li>Share the code or QR with the recipient.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">How to Download</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Go to the Download page.</li>
        <li>
          Enter the file code and click <strong>Go</strong> (or scan the QR
          code).
        </li>
        <li>
          <strong>Single File:</strong> Downloads directly to your device.
        </li>
        <li>
          <strong>Multiple Files:</strong> QuickDrop will zip them automatically
          for a single download.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Limits & Restrictions</h2>
      <ul className="list-disc list-inside mb-4 space-y-1">
        <li>
          Total Upload Size: <strong>150 MB</strong> (across all files).
        </li>
        <li>
          <strong>Per-File Limits:</strong>
          <ul className="list-disc list-inside ml-6 mt-1 text-gray-600 dark:text-gray-400">
            <li>
              Videos: Max <strong>100 MB</strong> per file.
            </li>
            <li>
              Images: Max <strong>10 MB</strong> per file.
            </li>
            <li>
              Documents/Archives (PDF, ZIP, etc.): Max <strong>10 MB</strong>{" "}
              per file.
            </li>
          </ul>
        </li>
        <li>
          Retention: Files are deleted automatically after{" "}
          <strong>5 minutes</strong>.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Important Notes</h2>
      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>
            Do not use QuickDrop to upload confidential or sensitive files.
          </strong>
        </li>
        <li>
          This tool does not offer end-to-end encryption or permanent storage.
        </li>
        <li>
          The developer is <strong>not responsible</strong> for any data leaks,
          misuse, or file loss due to misuse of this service.
        </li>
      </ul>
    </div>
  );
};

export default UsagePage;
