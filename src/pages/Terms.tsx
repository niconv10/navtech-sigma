import { Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';

export default function Terms() {
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
          
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: January 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SIGMA, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
            <p>You must be at least 13 years old to use SIGMA.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Service Description</h2>
            <p>
              SIGMA is a grade tracking and estimation tool designed to help students organize and monitor their academic progress. It is important to understand that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SIGMA is <strong>NOT</strong> an official academic record</li>
              <li>SIGMA does <strong>NOT</strong> provide academic advice</li>
              <li>SIGMA is <strong>NOT</strong> affiliated with any educational institution</li>
              <li>All grades shown are estimates based on user-provided information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Disclaimer of Accuracy</h2>
            <div className="bg-warning-light border border-warning/30 rounded-xl p-5 not-prose">
              <p className="font-semibold text-foreground mb-3">IMPORTANT: SIGMA provides ESTIMATES ONLY based on information you enter. These estimates may differ from your actual grades.</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Professors may modify syllabi, grading policies, weights, or curves at any time without notice to SIGMA</li>
                <li>• SIGMA cannot access your official university records</li>
                <li>• Always verify grades through your official university portal</li>
                <li>• SIGMA is not responsible for any discrepancies between our estimates and your official grades</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
            <div className="bg-error-light border border-error/30 rounded-xl p-5 not-prose">
              <p className="font-semibold text-foreground mb-3">SIGMA AND ITS CREATORS SHALL NOT BE LIABLE FOR:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Academic outcomes including but not limited to failing grades, academic probation, or loss of scholarships</li>
                <li>• Decisions made based on grade estimates shown in the app</li>
                <li>• Missed deadlines or assignments</li>
                <li>• Changes made by professors to course requirements</li>
                <li>• Any direct, indirect, incidental, or consequential damages</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. User Responsibilities</h2>
            <p>As a user of SIGMA, you agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate information when entering course data</li>
              <li>Verify all information with official university sources</li>
              <li>Keep your login credentials secure and confidential</li>
              <li>Not share your account with other users</li>
              <li>Use the service in compliance with all applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Data & Privacy</h2>
            <p>
              Your use of SIGMA is also governed by our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using SIGMA, you consent to our data practices as described in that policy.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is stored securely using industry-standard encryption</li>
              <li>You can delete your account and all associated data at any time</li>
              <li>We do not sell your personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Modifications to Service</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue SIGMA at any time without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at support@sigma-app.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
