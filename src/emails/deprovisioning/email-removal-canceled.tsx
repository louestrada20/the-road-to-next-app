import {
    Body,
    Container,
    Head,
    Html,
    Section,
    Tailwind,
    Text,
} from "@react-email/components"

type EmailRemovalCanceledProps = {
    organizationName: string;
    adminName: string;
    savedUserCount: number;
};

const EmailRemovalCanceled = ({ 
    organizationName, 
    adminName,
    savedUserCount,
}: EmailRemovalCanceledProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="bg-white rounded-lg p-8 my-8 mx-auto max-w-xl border-t-4 border-green-600">
                        <Section>
                            <Text className="text-2xl font-bold text-green-600 mb-4">
                                ✅ Great News! Member Removal Canceled
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Hello {adminName},
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Wonderful news! Your plan upgrade for <strong>{organizationName}</strong> has 
                                been confirmed, and the scheduled member removal has been <strong>canceled</strong>.
                            </Text>
                            <Section className="bg-green-50 rounded p-4 mb-6">
                                <Text className="text-green-900 font-semibold mb-2">
                                    🎉 All {savedUserCount} member{savedUserCount !== 1 ? 's are' : ' is'} safe!
                                </Text>
                                <Text className="text-green-800">
                                    No members will be removed from your organization. Everyone keeps their 
                                    full access and all features remain available.
                                </Text>
                            </Section>
                            <Text className="text-gray-700 mb-4">
                                Thank you for upgrading! Your team can continue working without interruption.
                            </Text>
                            <Text className="text-gray-700 mb-6">
                                If you have any questions about your new plan or need assistance, 
                                our support team is always here to help.
                            </Text>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-sm text-gray-500">
                                Thank you for your continued trust in our platform.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailRemovalCanceled.PreviewProps = {
    organizationName: "Acme Corporation",
    adminName: "John Doe",
    savedUserCount: 5,
} as EmailRemovalCanceledProps;

export default EmailRemovalCanceled;

