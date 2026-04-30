import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const newGroupId = customAlphabet(alphabet, 14);
