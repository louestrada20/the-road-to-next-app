import {
    Body,
    Button,
    Container,
    Head,
    Html,
    Section,
    Tailwind,
    Text,
} from "@react-email/components"

type EmailFinalWarningProps = {
    organizationName: string;
    adminName: string;
    hoursRemaining: number;
    affectedUserCount: number;
    executionDate: string;
};

const EmailFinalWarning = ({ 
    organizationName, 
    adminName,
    hoursRemaining,
    affectedUserCount, 
    executionDate,
}: EmailFinalWarningProps) => {
    const formattedDate = new Date(executionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });

    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="bg-white rounded-lg p-8 my-8 mx-auto max-w-xl border-t-4 border-red-600">
                        <Section>
                            <Text className="text-2xl font-bold text-red-600 mb-4">
                                ⚠️ Final Warning: {hoursRemaining} Hours Remaining
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Hello {adminName},
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                <strong>This is your final warning.</strong> In approximately <strong>{hoursRemaining} hours</strong>, 
                                {affectedUserCount} member{affectedUserCount !== 1 ? 's' : ''} will be automatically removed 
                                from <strong>{organizationName}</strong>.
                            </Text>
                            <Section className="bg-red-50 border-2 border-red-500 rounded p-4 mb-6">
                                <Text className="text-red-900 font-bold mb-2">
                                    Scheduled Removal Time:
                                </Text>
                                <Text className="text-red-800 text-lg">
                                    {formattedDate}
                                </Text>
                            </Section>
                            <Text className="text-gray-700 mb-4">
                                <strong>What happens after removal:</strong>
                            </Text>
                            <Text className="text-gray-700 mb-2">
                                • Removed members will lose access to the organization
                            </Text>
                            <Text className="text-gray-700 mb-2">
                                • Their tickets and comments will be preserved
                            </Text>
                            <Text className="text-gray-700 mb-6">
                                • Members can be reactivated if you upgrade your plan
                            </Text>
                            <Text className="text-gray-700 mb-6 font-semibold">
                                Act now to prevent automatic removal!
                            </Text>
                        </Section>
                        <Section className="text-center">
                            <Button 
                                href={`${process.env.NEXT_PUBLIC_URL}/pricing`}
                                className="bg-red-600 rounded text-white px-8 py-4 font-bold text-lg"
                            >
                                Upgrade Immediately
                            </Button>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-sm text-gray-500">
                                Questions? Contact support immediately for assistance.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailFinalWarning.PreviewProps = {
    organizationName: "Acme Corporation",
    adminName: "John Doe",
    hoursRemaining: 24,
    affectedUserCount: 5,
    executionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
} as EmailFinalWarningProps;

export default EmailFinalWarning;

