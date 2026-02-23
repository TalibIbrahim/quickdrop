const PrivacyPolicy = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 dark:pt-56 pb-28 text-gray-800 dark:text-neutral-200">
      <h1 className="text-3xl font-bold mb-6 text-blue-600 text-center ">
        Privacy Policy
      </h1>
      <div className="w-full h-0.5 bg-blue-500 mx-auto mt-2 mb-6 rounded" />

      <p className="mb-4">
        QuickDrop is designed to be a fast, minimal file-sharing utility. We
        take your privacy seriously, but users must understand the limitations
        of this tool.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Data Handling</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Files are uploaded to a cloud service.</li>
        <li>No personal data, names, or IP addresses are stored.</li>
        <li>
          Files are automatically deleted <strong>after 5 minutes</strong>.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">No Encryption</h2>
      <p className="mb-4">
        Files are not encrypted. Anyone with the file code or link can access
        the file during the 5-minute window.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">User Responsibility</h2>
      <ul className="list-disc list-inside mb-4">
        <li>
          <strong>
            Do not upload sensitive, personal, or confidential files.
          </strong>
        </li>
        <li>
          The developer holds no responsibility for unauthorized access or data
          misuse.
        </li>
        <li>Use this tool at your own discretion.</li>
      </ul>

      <p className="mt-6 text-sm italic text-gray-600 dark:text-neutral-300 text-center">
        By using QuickDrop, you agree to these terms.
      </p>
    </div>
  );
};

export default PrivacyPolicy;
