export const metadata = {
  title: 'Data Deletion — Supervint',
  alternates: {
    canonical: '/deletion',
  },
};

export default function Deletion() {
  return (
    <div className="prose">
      <h1>Data Deletion for Supervint</h1>
      <span className="updated">Last Updated: 6 July 2026</span>

      <p>
        This page explains what data Supervint stores and how you can have it deleted, in addition to what is
        already described in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>What Data Supervint Stores</h2>
      <ul>
        <li>
          <strong>Locally, in your browser:</strong> A client identifier, your configured searches, settings, and
          found-item history are stored in <code>chrome.storage.local</code> on your own device.
        </li>
        <li>
          <strong>Email address:</strong> If you set up email alerts, the email address you provide is stored so
          alerts can be sent to you.
        </li>
        <li>
          <strong>Plan and subscription data:</strong> If you subscribe to a paid plan, your plan status and related
          usage data (such as daily email counters) are stored server-side in our Upstash KV database.
        </li>
        <li>
          <strong>Google Sheets access token:</strong> If you connect Google Sheets, an access token is stored so the
          Service can continue writing to your spreadsheet on your behalf.
        </li>
      </ul>

      <h2>How to Delete Your Data</h2>
      <ul>
        <li>
          <strong>Uninstall the extension:</strong> This immediately removes all data stored locally in your
          browser, including your searches, settings, and found-item history.
        </li>
        <li>
          <strong>Email us:</strong> Contact{' '}
          <a href="mailto:support@supervint.com">support@supervint.com</a> to request deletion of any server-side
          data, such as Upstash KV records and email counters.
        </li>
        <li>
          <strong>Disconnect Google Sheets:</strong> You can revoke Supervint&apos;s access to Google Sheets at any
          time from within the extension popup, or directly from your Google Account&apos;s third-party permissions
          at{' '}
          <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer">
            myaccount.google.com
          </a>
          .
        </li>
      </ul>

      <h2>Stripe Subscription Data</h2>
      <p>
        You can cancel your subscription at any time via the extension popup&apos;s &quot;Manage subscription&quot;
        option. Cancelling stops future billing, but Stripe, our payment processor, retains transaction records for
        legal and tax purposes in accordance with its own policies. Supervint does not control how long Stripe
        retains this data.
      </p>

      <h2>Processing Time</h2>
      <p>
        We will process any deletion request submitted to <a href="mailto:support@supervint.com">support@supervint.com</a>{' '}
        within 30 days of receipt.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have any questions about deleting your data, please contact us at{' '}
        <a href="mailto:support@supervint.com">support@supervint.com</a>.
      </p>
    </div>
  );
}
