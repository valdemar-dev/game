export default async function validateRequest(listOfRequiredFields: Array<any>, req: any) {
    let isValid = true;

    listOfRequiredFields.forEach((requiredField) => {
        if (!req[requiredField]) {
            isValid = false;
        }
    });

    return {
        isValid,
    }
}