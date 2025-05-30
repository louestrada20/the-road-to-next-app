export const homePath = () => '/';

export const ticketsPath = () => '/tickets';
export const ticketsByOrganizationPath = () => '/tickets/organization';

export const ticketPath = (ticketId: string) => `/tickets/${ticketId}`;
export const ticketEditPath = (ticketId: string) => `/tickets/${ticketId}/edit`;

export const signUpPath = () =>  "/sign-up";
export const signInPath = () =>  "/sign-in";
export const emailVerificationPath = () => "/email-verification";
export const emailInvitationPath = () => "/email-invitation";
export const passwordForgotPath = () =>  "/password-forgot";
export const passwordResetPath = () => "/password-reset";
export const accountProfilePath = () => "/account/profile";
export const accountPasswordPath = () => "/account/password";

export const organizationCreatePath = () => "/organization/create";
export const organizationPath = () => "/organization";
export const membershipsPath = (organizationId: string) => `/organization/${organizationId}/memberships`;
export const onboardingPath = () => "/onboarding";
export const selectActiveOrganizationPath = () => "/onboarding/select-active-organization";
export const invitationsPath = (organizationId: string) => `/organization/${organizationId}/invitations`;