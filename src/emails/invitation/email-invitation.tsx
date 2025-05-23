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

type EmailInvitationProps = {
    fromUser: string,
    fromOrganization: string,
    url: string,
};

const EmailInvitation = ({ fromUser, fromOrganization, url }: EmailInvitationProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body>
                    <Container>
                        <Section>
                            <Text>
                                Hello there, {fromUser} invited you to join {fromOrganization}.
                                Click the link below to accept the invitation.
                            </Text>
                        </Section>
                        <Section>
                            <Button href={url} className="bg-black rounded text-white p-2 m-2">
                                Accept Invitation
                            </Button>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailInvitation.PreviewProps = {
    fromUser: "Louis Estrada",
    fromOrganization: "Test Organization",
    url: "http://localhost:3000/email-invitation/abc123",
}

export default EmailInvitation;