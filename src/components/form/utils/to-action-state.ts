import {ZodError} from "zod";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionState<T = any> = {
    status?: "SUCCESS" | "ERROR";
    fieldErrors: Record<string, string[]> | undefined;
    message: string,
    payload?: FormData
    timestamp: number,
    data?: T,
};

export const EMPTY_ACTION_STATE: ActionState = {
    message: "",
    fieldErrors: {},
    timestamp: Date.now(),
}

export const fromErrorToActionState = (error: unknown, formData?: FormData): ActionState => {

    if (error instanceof ZodError) {
        // If validation error with Zod, return first error message
        return {
            status: "ERROR",
            message: "",
            // @ts-expect-error - should be good
            fieldErrors: error.flatten().fieldErrors,
            payload: formData,
            timestamp: Date.now(),
        }
    } else if (error instanceof Error) {
        // if another error instance, return error message
        // e.g. database error.
        return {
            status: "ERROR",
            message: error.message,
            fieldErrors: {},
            payload: formData,
            timestamp: Date.now(),
        }
    } else {
        // if not an error instance but something else crashed
        // return generic error message.
        return {
            status: "ERROR",
            message: "An unknown error occured",
            fieldErrors: {},
            payload: formData,
            timestamp: Date.now(),
        }
    }

}

export const toActionState = (
    status:ActionState['status'] ,
    message: string,
    formData?: FormData,
    data?: unknown
): ActionState =>  {
    return { status,
        message,
        fieldErrors: {},
        payload: formData,
        timestamp: Date.now(),
        data,
    }
}