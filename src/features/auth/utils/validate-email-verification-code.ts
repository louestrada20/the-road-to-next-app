
import {prisma} from "@/lib/prisma";

export const validateEmailVerificationCode = async (userId: string, code: string, email: string) => {

    const emailVerificationToken = await prisma.emailVerificationToken.findFirst({
        where: {
            userId,
        }
    });

    if (!emailVerificationToken || emailVerificationToken.code !== code) {
        return false
    }

    //token is one time use only, so if it is valid, delete it before we return true.
    await prisma.emailVerificationToken.delete({
        where: {
            id: emailVerificationToken.id,
        },
    });

    const isExpired = Date.now() > emailVerificationToken.expiresAt.getTime();
    if (isExpired) {
        return false
    }

    if (emailVerificationToken.email !== email) {
        return false
    }


    return true;
}

