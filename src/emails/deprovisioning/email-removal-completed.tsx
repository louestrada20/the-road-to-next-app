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

type EmailRemovalCompletedProps = {
    organizationName: string;
    adminName: string;
    deactivatedUserCount: number;
};

const EmailRemovalCompleted = ({ 
    organizationName, 
    adminName,
    deactivatedUserCount,
}: EmailRemovalCompletedProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="bg-white rounded-lg p-8 my-8 mx-auto max-w-xl">
                        <Section>
                            <Text className="text-2xl font-bold text-gray-900 mb-4">
                                Member Removal Completed
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Hello {adminName},
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                As scheduled, <strong>{deactivatedUserCount} member{deactivatedUserCount !== 1 ? 's have' : ' has'}</strong> been 
                                deactivated from <strong>{organizationName}</strong> due to your current plan limits.
                            </Text>
                            <Section className="bg-blue-50 rounded p-4 mb-6">
                                <Text className="font-semibold text-gray-900 mb-2">
                                    What this means:
                                </Text>
                                <Text className="text-gray-700 mb-2">
                                    • Deactivated members can no longer access the organization
                                </Text>
                                <Text className="text-gray-700 mb-2">
                                    • All their tickets and comments remain intact
                                </Text>
                                <Text className="text-gray-700">
                                    • Historical data is fully preserved for audit purposes
                                </Text>
                            </Section>
                            <Text className="text-gray-700 mb-4 font-semibold">
                                How to reactivate members:
                            </Text>
                            <Text className="text-gray-700 mb-6">
                                Upgrade to a higher plan that supports more members. Once upgraded, 
                                you can reactivate any deactivated members from your member management page, 
                                and they&apos;ll regain full access immediately.
                            </Text>
                        </Section>
                        <Section className="text-center">
                            <Button 
                                href={`${process.env.NEXT_PUBLIC_URL}/pricing`}
                                className="bg-blue-600 rounded text-white px-6 py-3 font-semibold"
                            >
                                View Plans
                            </Button>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-sm text-gray-500">
                                Need assistance? Our support team is here to help.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailRemovalCompleted.PreviewProps = {
    organizationName: "Acme Corporation",
    adminName: "John Doe",
    deactivatedUserCount: 5,
} as EmailRemovalCompletedProps;

export default EmailRemovalCompleted;

