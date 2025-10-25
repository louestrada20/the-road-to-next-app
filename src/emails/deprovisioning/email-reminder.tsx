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

type EmailReminderProps = {
    organizationName: string;
    adminName: string;
    daysRemaining: number;
    affectedUserCount: number;
    scheduledDate: string;
};

const EmailReminder = ({ 
    organizationName, 
    adminName,
    daysRemaining,
    affectedUserCount, 
    scheduledDate,
}: EmailReminderProps) => {
    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="bg-gray-100 font-sans">
                    <Container className="bg-white rounded-lg p-8 my-8 mx-auto max-w-xl">
                        <Section>
                            <Text className="text-2xl font-bold text-orange-600 mb-4">
                                ⏰ Reminder: {daysRemaining} Days Until Member Removal
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Hello {adminName},
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                This is a reminder that <strong>{affectedUserCount} member{affectedUserCount !== 1 ? 's' : ''}</strong> 
                                {affectedUserCount !== 1 ? ' are' : ' is'} scheduled to be removed from <strong>{organizationName}</strong> on <strong>{formattedDate}</strong>.
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                You still have <strong>{daysRemaining} days</strong> to take action:
                            </Text>
                            <Section className="bg-orange-50 border-l-4 border-orange-500 rounded p-4 mb-6">
                                <Text className="text-gray-800 mb-2">
                                    • Upgrade to a higher plan to keep all members
                                </Text>
                                <Text className="text-gray-800">
                                    • Manually remove members to stay within your plan limit
                                </Text>
                            </Section>
                            <Text className="text-gray-700 mb-6">
                                After the scheduled date, affected members will lose access to the organization 
                                but can be reactivated if you upgrade.
                            </Text>
                        </Section>
                        <Section className="text-center">
                            <Button 
                                href={`${process.env.NEXT_PUBLIC_URL}/pricing`}
                                className="bg-orange-600 rounded text-white px-6 py-3 font-semibold"
                            >
                                Upgrade Now
                            </Button>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-sm text-gray-500">
                                Need help? Contact our support team.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailReminder.PreviewProps = {
    organizationName: "Acme Corporation",
    adminName: "John Doe",
    daysRemaining: 7,
    affectedUserCount: 5,
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
} as EmailReminderProps;

export default EmailReminder;

