export const metadata = {
  title: 'Terms of Service — Supervint',
};

export default function Terms() {
  return (
    <div className="prose">
      <h1>Terms of Service for Supervint</h1>
      <span className="updated">Last Updated: 26 June 2026</span>

      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Supervint (the &quot;Service&quot;), a Chrome
        extension that monitors Vinted search results and provides notifications, spreadsheet logging, and email
        alerts. By installing or using Supervint, you agree to these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Supervint runs in your browser and periodically checks Vinted search results you configure, using your
        existing logged-in Vinted session. It can notify you of new listings, log results to a Google Sheet in
        your own Google account (if connected), and send email alerts for items below a price threshold you set
        (if configured). Supervint only operates while your browser is open and your computer is active.
      </p>

      <h2>2. Your Account and Responsibilities</h2>
      <p>
        You are responsible for your own Vinted account and for complying with Vinted&apos;s own Terms of
        Service. Supervint is an independent tool and is not affiliated with, endorsed by, or operated by
        Vinted. You use Supervint at your own discretion and accept any risk associated with automated
        monitoring of Vinted, including the possibility that Vinted may restrict, limit, or take action on
        accounts it determines are using automated tools, regardless of the precautions Supervint takes.
      </p>
      <p>
        You are responsible for keeping any email address, Google account connection, or other settings you
        provide accurate and secure.
      </p>

      <h2>3. No Guarantee of Results</h2>
      <p>
        Supervint is provided &quot;as is.&quot; We do not guarantee that it will detect every new listing,
        that notifications or emails will always be delivered, or that any particular item will be available
        for purchase by the time you act on an alert. Vinted&apos;s own systems, network conditions, or your
        device being asleep or offline can all affect whether and when Supervint detects something.
      </p>

      <h2>4. Subscriptions and Payment</h2>
      <p>
        If you purchase a paid plan, you agree to pay the fees described at the time of purchase. Plans renew
        automatically unless cancelled. You may cancel at any time; cancellation takes effect at the end of
        the current billing period, and we do not provide partial refunds for unused time within a billing
        period, except where required by law.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>
        You agree not to use Supervint to violate Vinted&apos;s Terms of Service, to harass or abuse other
        users, or to attempt to circumvent any rate limits, safety pauses, or daily caps built into the
        Service for the purpose of account protection. We may suspend or terminate access for accounts found
        to be misusing the Service.
      </p>

      <h2>6. Third-Party Services</h2>
      <p>
        Supervint integrates with third-party services, including Vinted and, where you choose to connect
        them, Google Sheets and email-sending providers. Your use of those services is also governed by their
        own terms. We are not responsible for the availability, accuracy, or conduct of these third-party
        services.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Supervint and its developer are not liable for any indirect,
        incidental, or consequential damages arising from your use of the Service, including but not limited
        to lost sales, missed listings, or any action taken against your Vinted account. Our total liability
        for any claim relating to the Service is limited to the amount you paid us in the 3 months prior to
        the claim, or £0 if you used the free tier.
      </p>

      <h2>8. Changes to the Service or Terms</h2>
      <p>
        We may update Supervint&apos;s features or these Terms from time to time. We will post the updated
        Terms on this page with a new &quot;Last Updated&quot; date. Continued use of the Service after
        changes take effect constitutes acceptance of the updated Terms.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using Supervint at any time by uninstalling the extension and, if applicable, cancelling
        your subscription. We may suspend or terminate your access to the Service if you violate these Terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have questions about these Terms, contact us at{' '}
        <a href="mailto:garden4kent@gmail.com">garden4kent@gmail.com</a>.
      </p>
    </div>
  );
}
