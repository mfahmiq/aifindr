import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy | The AI Select',
    description: 'Privacy Policy for The AI Select',
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-muted-foreground mb-6">
                    Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                <p className="mb-4">
                    This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Interpretation and Definitions</h2>
                <h3 className="text-xl font-medium mt-6 mb-3">Interpretation</h3>
                <p className="mb-4">
                    The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                </p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">Collecting and Using Your Personal Data</h2>
                <p className="mb-4">
                    This section will be updated with specific details about data collection practices as the application grows.
                </p>
            </div>
        </div>
    )
}
