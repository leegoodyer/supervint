export const metadata = {
  title: 'Privacy Policy — Supervint',
  alternates: {
    canonical: '/privacy',
  },
};

export default function Privacy() {
  return (
    <div className="prose">
      <h1>Privacy Policy for Supervint</h1>
      <span className="updated">Last Updated: 26 June 2026</span>

      <p>
        This Privacy Policy describes how Supervint (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and
        discloses information when you use our Chrome extension (the &quot;Service&quot;).
      </p>

      <h2>Information We Collect</h2>
      <p>
        We collect information directly from you when you provide it to us, and automatically as you use the Service.
      </p>
      <ul>
        <li>
          <strong>Personal Information You Provide:</strong> When you connect your Google account to Supervint, we
          request access to Google Sheets so that the Service can create and write to a spreadsheet in your own Google
          Drive on your behalf. We do not access any other Google data (such as Gmail, Calendar, or other Drive files)
          beyond what is required to create and update this spreadsheet. If you choose to set up email alerts, you
          provide an email address to receive those alerts.
        </li>
        <li>
          <strong>Vinted Search Data:</strong> The Service uses your existing, logged-in Vinted browser session to
          periodically check search results you configure within the extension. We do not collect or store your Vinted
          password or login credentials; the Service relies on your browser&apos;s existing session with Vinted, in the
          same way a normal visit to the Vinted website would.
        </li>
        <li>
          <strong>Usage Data:</strong> We store the search terms, settings (such as active hours and daily check
          limits), and items found through your configured searches locally in your browser, and, if you connect Google
          Sheets, in a spreadsheet within your own Google account.
        </li>
      </ul>

      <h2>How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>
          Operate the Service&apos;s core function: monitoring Vinted search results you configure and notifying you of
          new listings.
        </li>
        <li>
          Write new listing data (such as item title, price, and link) to a Google Sheet in your own Google account, if
          you choose to connect this feature.
        </li>
        <li>
          Send email alerts to the address you provide, if you choose to set a price threshold for this feature.
        </li>
        <li>Detect, prevent, and address technical issues with the Service.</li>
      </ul>

      <h2>How We Share Your Information</h2>
      <p>We do not sell your personal information. We share information only in the following limited circumstances:</p>
      <ul>
        <li>
          <strong>With Google:</strong> When you connect Google Sheets, we use Google&apos;s APIs, under the
          permissions you grant, solely to create and write to a spreadsheet in your own Google Drive. We do not
          access, read, or store the contents of any other files in your Google account.
        </li>
        <li>
          <strong>With Vinted:</strong> The Service fetches publicly viewable search results from Vinted using your
          existing browser session, in the same way browsing the Vinted website normally would. We do not submit any
          of your personal information to Vinted beyond what your browser session already provides.
        </li>
        <li>
          <strong>Service Providers:</strong> If you enable email alerts, item and price details relevant to that
          specific alert are passed to a transactional email-sending service in order to deliver the email to the
          address you provided.
        </li>
        <li>
          <strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response
          to valid requests by public authorities.
        </li>
      </ul>

      <h2>Data Security</h2>
      <p>
        Search settings and found-item data are stored locally in your browser using Chrome&apos;s standard storage
        APIs. Data written to Google Sheets is stored in your own Google account, governed by Google&apos;s own
        security practices. We implement reasonable measures to protect any information that passes through the
        Service, but no internet transmission or storage method is completely secure.
      </p>

      <h2>Your Choices</h2>
      <p>
        You can disconnect Google Sheets access at any time from within the extension or directly through your Google
        Account&apos;s third-party app permissions. You can stop any search, delete saved searches, or remove email
        alert settings at any time within the extension. Uninstalling the extension removes all locally stored data
        from your browser.
      </p>

      <h2>Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify users of material changes by posting the
        updated Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at{' '}
        <a href="mailto:support@supervint.com">support@supervint.com</a>.
      </p>
    </div>
  );
}
