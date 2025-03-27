import {Body, Container, Head, Html, Section, Tailwind, Text} from "@react-email/components";


type EmailWelcomeProps = {
    toName: string,
}

const EmailWelcome = ({toName}: EmailWelcomeProps) => {
    return (
        <Html>
            <Head />
            <Tailwind>
                <Body className="font-sans m-8 text-center">
                    <Container>
                        <Section>
                            <Text>
                                Hello {toName}, thanks for signing up for our app TicketBounty!

                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );

}


EmailWelcome.PreviewProps = {
    toName: "Louis Estrada",
}
export default EmailWelcome