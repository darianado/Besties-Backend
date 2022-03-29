"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetCurrentDateByYears = exports.errorMessage = exports.successMessage = exports.compareCategorizedInterests = void 0;
const jaccard = require('jaccard');
/**
 * Calculates the Jaccard index (intersection over union) of the interests contained in the two objects to be compared.
 * @param c1 A 'CategorizedInterests' object to compare
 * @param c2 A 'CategorizedInterests' object to compare
 * @returns The Jaccard-index of similarity between the interests in the two sets.
 */
const compareCategorizedInterests = function (c1, c2) {
    const s1 = c1.getFlattenedInterests();
    const s2 = c2.getFlattenedInterests();
    const index = jaccard.index(s1, s2);
    return index;
};
exports.compareCategorizedInterests = compareCategorizedInterests;
/**
 * Creates a success message.
 * Can be used to return to any caller when the requested function executed as intended.
 * @param data Object to return as payload/result of the function
 * @param status HTTP-like status code that indicates the context of the result
 * @returns Success message object
 */
const successMessage = function (data, status = 200) {
    return {
        "status": status,
        "data": data
    };
};
exports.successMessage = successMessage;
/**
 * Creates an error message.
 * Can be used to return to any caller when the requested function could not execute as intended.
 * @param message Message to be sent in 'message' field
 * @param status HTTP-like status code that supports the message
 * @returns Error message object
 */
const errorMessage = function (message, status = 400) {
    return {
        "status": status,
        "message": message
    };
};
exports.errorMessage = errorMessage;
/**
 * Offsets the current date by an amount of years in the past.
 * @param years Number of years to offset by (in negative direction)
 * @returns Offset date
 */
const offsetCurrentDateByYears = function (years) {
    const currentDate = new Date();
    return new Date(currentDate.setFullYear(currentDate.getFullYear() - years));
};
exports.offsetCurrentDateByYears = offsetCurrentDateByYears;
//# sourceMappingURL=utility.js.map