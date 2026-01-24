import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service | The AI Select',
    description: 'Terms of Service for The AI Select',
}

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-6">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                <p className="mb-4">
                    Please read these terms and conditions carefully before using Our Service.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Interpretation and Definitions</h2>
                <h3 className="text-xl font-medium mt-6 mb-3">Interpretation</h3>
                <p className="mb-4">
                    The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Acknowledgment</h2>
                <p className="mb-4">
                    These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
                </p>

                <p className="mb-4">
                    Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
                </p>
            </div>
        </div>
    )
}
