"use strict";
// Utility functions for handling JSON fields in SQLite
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonField = parseJsonField;
exports.stringifyJsonField = stringifyJsonField;
exports.parseJsonArray = parseJsonArray;
exports.hasJsonArrayItem = hasJsonArrayItem;
exports.hasJsonArraySomeItems = hasJsonArraySomeItems;
function parseJsonField(value) {
    if (!value)
        return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    return value;
}
function stringifyJsonField(value) {
    if (typeof value === 'string')
        return value;
    return JSON.stringify(value || null);
}
function parseJsonArray(value) {
    const parsed = parseJsonField(value);
    return Array.isArray(parsed) ? parsed : [];
}
function hasJsonArrayItem(jsonField, item) {
    const array = parseJsonArray(jsonField);
    return array.includes(item);
}
function hasJsonArraySomeItems(jsonField, items) {
    const array = parseJsonArray(jsonField);
    return items.some(item => array.includes(item));
}
//# sourceMappingURL=json.js.map