import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">SIGMA</span>
          </div>
          
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password</li>
              <li><strong>Profile Information:</strong> University, major, graduation year, GPA goal</li>
              <li><strong>Academic Data:</strong> Courses, assignments, grades, and schedules you enter</li>
              <li><strong>Usage Data:</strong> Anonymized analytics about how you use the app</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
            <p>Your data is used to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide the grade tracking and estimation service</li>
              <li>Send notifications you enable (assignment reminders, grade alerts)</li>
              <li>Improve the service through anonymized analytics</li>
              <li>Communicate with you about service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Data Security</h2>
            <p>We take the security of your data seriously:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data is encrypted in transit using HTTPS/TLS</li>
              <li>Data is encrypted at rest in our database</li>
              <li>We use Row-Level Security (RLS) to ensure users can only access their own data</li>
              <li>We do not sell your data to third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Data Sharing</h2>
            <div className="bg-success-light border border-success/30 rounded-xl p-5 not-prose">
              <p className="font-semibold text-foreground mb-3">We do NOT share your data with:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Universities or educational institutions</li>
                <li>• Employers or recruiters</li>
                <li>• Advertisers or marketing companies</li>
                <li>• Any third parties for commercial purposes</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Exception:</strong> We may disclose data if required by law or valid legal process.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. FERPA Compliance Note</h2>
            <div className="bg-info-light border border-info/30 rounded-xl p-5 not-prose">
              <p className="text-sm text-muted-foreground">
                SIGMA does not access your official educational records. All data in SIGMA is self-reported by you. SIGMA is not a covered entity under FERPA as we do not receive data from educational institutions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> View all data we have about you</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Delete:</strong> Permanently delete your account and all associated data</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is kept while your account is active</li>
              <li>Upon account deletion, data is removed within 30 days</li>
              <li>Backups are purged within 90 days of account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Cookies & Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We use anonymized analytics to understand how the app is used and to improve the service. You can disable non-essential cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
            <p>
              SIGMA is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover we have collected data from a child under 13, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through the app. Your continued use of SIGMA after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your data rights, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> privacy@sigma-app.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
