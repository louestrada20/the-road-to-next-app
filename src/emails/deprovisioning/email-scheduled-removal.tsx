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

type EmailScheduledRemovalProps = {
    organizationName: string;
    adminName: string;
    affectedUserCount: number;
    scheduledDate: string;
    membersList: string[];
};

const EmailScheduledRemoval = ({ 
    organizationName, 
    adminName,
    affectedUserCount, 
    scheduledDate,
    membersList 
}: EmailScheduledRemovalProps) => {
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
                            <Text className="text-2xl font-bold text-gray-900 mb-4">
                                Action Required: Member Removal Scheduled
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Hello {adminName},
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                Your organization <strong>{organizationName}</strong> has been downgraded 
                                to a plan with fewer member seats.
                            </Text>
                            <Text className="text-gray-700 mb-4">
                                As a result, <strong>{affectedUserCount} member{affectedUserCount !== 1 ? 's' : ''}</strong> 
                                {affectedUserCount !== 1 ? ' are' : ' is'} scheduled for removal on <strong>{formattedDate}</strong>.
                            </Text>
                            {membersList.length > 0 && (
                                <Section className="bg-gray-50 rounded p-4 mb-4">
                                    <Text className="font-semibold text-gray-900 mb-2">Affected Members:</Text>
                                    <Text className="text-gray-700 text-sm">
                                        {membersList.slice(0, 5).map((userId, index) => (
                                            <span key={userId}>
                                                {userId}
                                                {index < Math.min(membersList.length, 5) - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                        {membersList.length > 5 && ` and ${membersList.length - 5} more...`}
                                    </Text>
                                </Section>
                            )}
                            <Text className="text-gray-700 mb-6">
                                You have 14 days to upgrade your plan or manually remove members to prevent 
                                automatic deactivation. To keep all your team members, upgrade to a higher plan today.
                            </Text>
                        </Section>
                        <Section className="text-center">
                            <Button 
                                href={`${process.env.NEXT_PUBLIC_URL}/pricing`}
                                className="bg-blue-600 rounded text-white px-6 py-3 font-semibold"
                            >
                                Upgrade Plan
                            </Button>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-sm text-gray-500">
                                If you have any questions, please contact our support team.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailScheduledRemoval.PreviewProps = {
    organizationName: "Acme Corporation",
    adminName: "John Doe",
    affectedUserCount: 5,
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    membersList: ["user1-id", "user2-id", "user3-id", "user4-id", "user5-id"],
} as EmailScheduledRemovalProps;

export default EmailScheduledRemoval;

