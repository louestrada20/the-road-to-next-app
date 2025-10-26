export const includeUsername = {
    user: {
        select: {
            username: true,
        },
    },
};

export const includeNames = {
    user: {
        select: {
            firstName: true,
            lastName: true,
            username: true,
        },
    },
};

export const includeUsernameWithSolver = {
    user: {
        select: {
            username: true,
        },
    },
    solvedBy: {
        select: {
            username: true,
            firstName: true,
            lastName: true,
        },
    },
};
