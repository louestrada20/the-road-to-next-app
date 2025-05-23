import {Body, Container, Head, Html, Section, Tailwind, Text} from "@react-email/components";


type EmailVerificationProps = {
    toName: string,
    otp: string;
}

const EmailVerification = ({toName, otp}: EmailVerificationProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="font-sans m-8 text-center">
                    <Container>
                        <Section>
                            <Text>
                                Hello {toName}, please copy and paste the code below to verify your email with our app!
                            </Text>
                        </Section>
                        <Section>
                            <Text className="bg-black rounded text-white p-2 m-2">{otp}</Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );

}


EmailVerification.PreviewProps = {
    toName: "Louis Estrada",
    otp: "ASDFASDF",
}
export default EmailVerification;