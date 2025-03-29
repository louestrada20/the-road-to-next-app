import {prisma} from "@/lib/prisma";
import {generateRandomCode} from "@/utils/crypto";

const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS = 1000 * 60 * 120; // 2 hours

export const generateEmailVerificationCode =  async (
    userId: string,
    email: string
)=> {

    await prisma.emailVerificationToken.deleteMany({
        where: {
            userId,
        },
    });

    const code = generateRandomCode();

    await prisma.emailVerificationToken.create({
        data: {
            code,
            userId,
            email,
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_LIFETIME_MS),
        },
    });



    return code;

}