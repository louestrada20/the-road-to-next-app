import {Body, Container, Head, Html, Section, Tailwind, Text} from "@react-email/components";

type EmailChangeVerificationProps = {
    toName: string;
    code: string;
}

const EmailChangeVerification = ({toName, code}: EmailChangeVerificationProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="font-sans m-8 text-center">
                    <Container>
                        <Section>
                            <Text>
                                Hello {toName}, please copy and paste the code below to verify your new email address:
                            </Text>
                        </Section>
                        <Section>
                            <Text className="bg-black rounded text-white p-2 m-2">{code}</Text>
                        </Section>
                        <Section>
                            <Text className="text-sm text-gray-600">
                                This code will expire in 2 hours. If you didn't request this change, please ignore this email.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

EmailChangeVerification.PreviewProps = {
    toName: "Louis Estrada",
    code: "ASDFASDF",
};

export default EmailChangeVerification;
